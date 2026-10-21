import { api, connectTestDB, createUser, disconnectTestDB } from './helpers';

type TestUser = Awaited<ReturnType<typeof createUser>>;
let owner: TestUser;
let commenter: TestUser;
let postId: string;
let commentId: string;
let replyId: string;

const auth = (user: TestUser) => ({ Authorization: `Bearer ${user.token}` });

beforeAll(async () => {
  await connectTestDB();
  owner = await createUser('postowner@example.test');
  commenter = await createUser('commenter@example.test');
  const post = await api().post('/api/posts/add').set(auth(owner)).send({ description: 'A post' }).expect(201);
  postId = post.body.data.data._id;
});
afterAll(disconnectTestDB);

describe('Comments', () => {
  it('adds a comment and a reply', async () => {
    const comment = await api().post('/api/comments/add').set(auth(commenter)).send({ refId: postId, onModel: 'Post', content: 'Nice' }).expect(201);
    commentId = comment.body.data.data._id;

    const reply = await api().post('/api/comments/add').set(auth(owner)).send({ refId: commentId, onModel: 'Comment', content: 'Thanks' }).expect(201);
    replyId = reply.body.data.data._id;
  });

  it('does not allow replying to a reply', async () => {
    await api().post('/api/comments/add').set(auth(owner)).send({ refId: replyId, onModel: 'Comment', content: 'Nested' }).expect(400);
  });

  it('respects allowComments on the post', async () => {
    const post = await api().post('/api/posts/add').set(auth(owner)).send({ description: 'Quiet post' }).expect(201);
    const quietPostId = post.body.data.data._id;
    await api().put(`/api/posts/update/${quietPostId}`).set(auth(owner)).send({ allowComments: false }).expect(200);
    await api().post('/api/comments/add').set(auth(commenter)).send({ refId: quietPostId, onModel: 'Post', content: 'Hi' }).expect(400);
  });

  it('lists post comments and replies', async () => {
    const comments = await api().get(`/api/comments/post/${postId}`).set(auth(owner)).expect(200);
    expect(comments.body.data.data).toHaveLength(1);
    expect(comments.body.data.data[0].ownerId.firstName).toBe('Tester');

    const replies = await api().get(`/api/comments/${commentId}/replies`).set(auth(owner)).expect(200);
    expect(replies.body.data.data).toHaveLength(1);
  });

  it('only lets the owner edit a comment', async () => {
    await api().put(`/api/comments/update/${commentId}`).set(auth(owner)).send({ content: 'Hacked' }).expect(403);
    const res = await api().put(`/api/comments/update/${commentId}`).set(auth(commenter)).send({ content: 'Very nice' }).expect(200);
    expect(res.body.data.data.content).toBe('Very nice');
  });
});

describe('Reacts', () => {
  it('adds, changes and lists reacts', async () => {
    await api().post('/api/reacts/react').set(auth(owner)).send({ refId: postId, onModel: 'Post', type: 'LIKE' }).expect(201);
    const changed = await api().post('/api/reacts/react').set(auth(owner)).send({ refId: postId, onModel: 'Post', type: 'LOVE' }).expect(200);
    expect(changed.body.data.data.type).toBe('LOVE');
    await api().post('/api/reacts/react').set(auth(commenter)).send({ refId: postId, onModel: 'Post', type: 'LIKE' }).expect(201);

    const res = await api().get(`/api/reacts/${postId}`).set(auth(owner)).expect(200);
    expect(res.body.data.data.total).toBe(2);
    expect(res.body.data.data.summary).toEqual({ LOVE: 1, LIKE: 1 });
  });

  it('rejects an unknown react type or target', async () => {
    await api().post('/api/reacts/react').set(auth(owner)).send({ refId: postId, onModel: 'Post', type: 'WOW' }).expect(400);
    await api().post('/api/reacts/react').set(auth(owner)).send({ refId: '0123456789abcdef01234567', onModel: 'Post', type: 'LIKE' }).expect(404);
  });

  it('removes a react', async () => {
    await api().delete(`/api/reacts/remove/${postId}`).set(auth(commenter)).expect(200);
    await api().delete(`/api/reacts/remove/${postId}`).set(auth(commenter)).expect(404);
  });
});

describe('Deleting', () => {
  it('lets the post owner delete a comment with its replies', async () => {
    await api().post('/api/reacts/react').set(auth(owner)).send({ refId: commentId, onModel: 'Comment', type: 'HAHA' }).expect(201);
    await api().delete(`/api/comments/delete/${commentId}`).set(auth(owner)).expect(200);

    const replies = await api().get(`/api/comments/${commentId}/replies`).set(auth(owner)).expect(200);
    expect(replies.body.data.data).toHaveLength(0);
    const reacts = await api().get(`/api/reacts/${commentId}`).set(auth(owner)).expect(200);
    expect(reacts.body.data.data.total).toBe(0);
  });

  it('deletes the comments and reacts of a deleted post', async () => {
    await api().post('/api/comments/add').set(auth(commenter)).send({ refId: postId, onModel: 'Post', content: 'Bye' }).expect(201);
    await api().delete(`/api/posts/delete/${postId}`).set(auth(owner)).expect(200);

    const comments = await api().get(`/api/comments/post/${postId}`).set(auth(owner)).expect(200);
    expect(comments.body.data.data).toHaveLength(0);
    const reacts = await api().get(`/api/reacts/${postId}`).set(auth(owner)).expect(200);
    expect(reacts.body.data.data.total).toBe(0);
  });
});
