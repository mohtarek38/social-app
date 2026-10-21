import { api, connectTestDB, createUser, disconnectTestDB } from './helpers';

type TestUser = Awaited<ReturnType<typeof createUser>>;
let owner: TestUser;
let stranger: TestUser;
let postId: string;

const auth = (user: TestUser) => ({ Authorization: `Bearer ${user.token}` });

beforeAll(async () => {
  await connectTestDB();
  owner = await createUser('owner@example.test');
  stranger = await createUser('stranger@example.test');
});
afterAll(disconnectTestDB);

describe('Posts', () => {
  it('requires login', async () => {
    await api().get('/api/posts/home').expect(400);
  });

  it('creates a post', async () => {
    const res = await api().post('/api/posts/add').set(auth(owner)).send({ description: 'Hello world' }).expect(201);
    postId = res.body.data.data._id;
    expect(res.body.data.data.ownerId).toBe(owner.id);
  });

  it('rejects an empty post', async () => {
    await api().post('/api/posts/add').set(auth(owner)).send({}).expect(400);
  });

  it('gets a post by id with its owner', async () => {
    const res = await api().get(`/api/posts/${postId}`).set(auth(stranger)).expect(200);
    expect(res.body.data.data.ownerId.firstName).toBe('Tester');
  });

  it('validates the post id', async () => {
    await api().get('/api/posts/not-an-id').set(auth(owner)).expect(400);
  });

  it('lists the home feed and a user posts with pagination', async () => {
    await api().post('/api/posts/add').set(auth(owner)).send({ description: 'Second post' }).expect(201);

    const home = await api().get('/api/posts/home?page=1&limit=1').set(auth(owner)).expect(200);
    expect(home.body.data.data.docs).toHaveLength(1);
    expect(home.body.data.data.docs[0].description).toBe('Second post'); // newest first
    expect(home.body.data.data.paginator.totalDocs).toBe(2);

    const userPosts = await api().get(`/api/posts/user/${owner.id}`).set(auth(stranger)).expect(200);
    expect(userPosts.body.data.data.docs).toHaveLength(2);
  });

  it('only lets the owner update a post', async () => {
    await api().put(`/api/posts/update/${postId}`).set(auth(stranger)).send({ description: 'Hacked' }).expect(403);
    const res = await api().put(`/api/posts/update/${postId}`).set(auth(owner)).send({ description: 'Edited' }).expect(200);
    expect(res.body.data.data.description).toBe('Edited');
  });

  it('only lets the owner delete a post', async () => {
    await api().delete(`/api/posts/delete/${postId}`).set(auth(stranger)).expect(403);
    await api().delete(`/api/posts/delete/${postId}`).set(auth(owner)).expect(200);
    await api().get(`/api/posts/${postId}`).set(auth(owner)).expect(404);
  });
});
