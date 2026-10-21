import { api, connectTestDB, createUser, disconnectTestDB, lastOtpFor, signUpBody } from './helpers';

// Mock Google token verification
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args) })),
}));
const googlePayload = (payload: object) => mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => payload });

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

describe('Sign up & email confirmation', () => {
  it('signs up without returning the password or OTPs', async () => {
    const res = await api().post('/api/auth/signup').send(signUpBody('signup@example.test')).expect(201);
    expect(res.body.data.data.email).toBe('signup@example.test');
    expect(res.body.data.data.password).toBeUndefined();
    expect(res.body.data.data.otps).toBeUndefined();
  });

  it('rejects a duplicate email', async () => {
    await api().post('/api/auth/signup').send(signUpBody('signup@example.test')).expect(409);
  });

  it('rejects invalid sign up data', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ ...signUpBody('bad@example.test'), passwordConfirmation: 'nope' })
      .expect(400);
    expect(res.body.error.message).toBe('Validation Error');
  });

  it('rejects a wrong OTP, then confirms with the right one', async () => {
    await api().post('/api/auth/confirm-email').send({ email: 'signup@example.test', otp: '000000' }).expect(400);
    await api().post('/api/auth/confirm-email').send({ email: 'signup@example.test', otp: lastOtpFor('signup@example.test') }).expect(200);
    await api().post('/api/auth/confirm-email').send({ email: 'signup@example.test', otp: lastOtpFor('signup@example.test') }).expect(400);
  });

  it('resends a new confirmation OTP', async () => {
    const email = 'resend@example.test';
    await api().post('/api/auth/signup').send(signUpBody(email)).expect(201);
    const firstOtp = lastOtpFor(email);
    await api().post('/api/auth/resend-confirmation').send({ email }).expect(200);
    const newOtp = lastOtpFor(email);
    if (newOtp !== firstOtp) {
      await api().post('/api/auth/confirm-email').send({ email, otp: firstOtp }).expect(400);
    }
    await api().post('/api/auth/confirm-email').send({ email, otp: newOtp }).expect(200);
    await api().post('/api/auth/resend-confirmation').send({ email }).expect(400);
  });
});

describe('Sign in, refresh & sign out', () => {
  it('rejects a wrong password', async () => {
    await api().post('/api/auth/signin').send({ email: 'signup@example.test', password: 'WrongPass1' }).expect(401);
  });

  it('refresh tokens can only be used once', async () => {
    const { refreshToken } = await createUser('refresh@example.test');
    const res = await api().post('/api/auth/refresh-token').send({ refreshToken }).expect(200);
    expect(res.body.data.data.tokens.accesstoken).toBeDefined();
    await api().post('/api/auth/refresh-token').send({ refreshToken }).expect(401);
  });

  it('rejects an access token used as a refresh token', async () => {
    const { token } = await createUser('wrongtoken@example.test');
    await api().post('/api/auth/refresh-token').send({ refreshToken: token }).expect(400);
  });

  it('blacklists the access token on sign out', async () => {
    const { token } = await createUser('signout@example.test');
    await api().post('/api/auth/signout').set('Authorization', `Bearer ${token}`).expect(200);
    await api().get('/api/profile').set('Authorization', `Bearer ${token}`).expect(401);
  });
});

describe('Forget & reset password', () => {
  it('gives the same answer for unknown emails', async () => {
    await api().post('/api/auth/forget-password').send({ email: 'nobody@example.test' }).expect(200);
  });

  it('resets the password with a single-use OTP', async () => {
    const { email } = await createUser('reset@example.test');
    await api().post('/api/auth/forget-password').send({ email }).expect(200);
    const otp = lastOtpFor(email);
    const body = { email, otp, password: 'NewPassword1', passwordConfirmation: 'NewPassword1' };

    await api().post('/api/auth/reset-password').send(body).expect(200);
    await api().post('/api/auth/signin').send({ email, password: 'NewPassword1' }).expect(200);
    await api().post('/api/auth/reset-password').send(body).expect(400);
  });
});

describe('Google sign in', () => {
  it('creates a verified Google user on first sign in', async () => {
    googlePayload({ email: 'google@example.test', email_verified: true, given_name: 'Jo', family_name: 'Smith', sub: 'google-id-1' });
    const res = await api().post('/api/auth/google').send({ idToken: 'fake-token' }).expect(200);
    const { accesstoken } = res.body.data.tokens;

    const profile = await api().get('/api/profile').set('Authorization', `Bearer ${accesstoken}`).expect(200);
    expect(profile.body.data.data.email).toBe('google@example.test');
    // "Jo" is shorter than the first name rule, so the fallback name is used
    expect(profile.body.data.data.firstName).toBe('Google');
  });

  it('signs in an existing Google user', async () => {
    googlePayload({ email: 'google@example.test', email_verified: true, sub: 'google-id-1' });
    await api().post('/api/auth/google').send({ idToken: 'fake-token' }).expect(200);
  });

  it('does not allow password sign in for Google users', async () => {
    await api().post('/api/auth/signin').send({ email: 'google@example.test', password: 'Password123' }).expect(400);
  });

  it('rejects Google sign in for an email registered with a password', async () => {
    googlePayload({ email: 'signup@example.test', email_verified: true, sub: 'google-id-2' });
    await api().post('/api/auth/google').send({ idToken: 'fake-token' }).expect(409);
  });

  it('rejects unverified or invalid Google tokens', async () => {
    googlePayload({ email: 'unverified@example.test', email_verified: false });
    await api().post('/api/auth/google').send({ idToken: 'fake-token' }).expect(401);

    mockVerifyIdToken.mockRejectedValueOnce(new Error('bad token'));
    await api().post('/api/auth/google').send({ idToken: 'fake-token' }).expect(401);
  });
});
