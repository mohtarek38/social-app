import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app';
import { emitter } from '../src/Utils/utils.barrel';

export const api = () => request(app);

// In-memory MongoDB for each test file
let mongoServer: MongoMemoryServer;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
};

export const disconnectTestDB = async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
};

// Capture OTPs from the "sendEmail" event instead of sending real emails
const sentEmails: { to: string; subject: string; content: string }[] = [];
emitter.on('sendEmail', (args) => sentEmails.push(args));

export const lastOtpFor = (email: string): string => {
  const mail = [...sentEmails].reverse().find((item) => item.to === email);
  const otp = mail?.content.match(/(\d{6})/)?.[1];
  if (!otp) throw new Error(`No OTP was sent to ${email}`);
  return otp;
};

export const signUpBody = (email: string) => ({
  firstName: 'Tester',
  lastName: 'User',
  email,
  password: 'Password123',
  passwordConfirmation: 'Password123',
  gender: 'male',
  DOB: '1999-01-01',
  phoneNumber: '01000000000',
});

// Sign up, confirm and sign in a user
export const createUser = async (email: string) => {
  await api().post('/api/auth/signup').send(signUpBody(email)).expect(201);
  await api().post('/api/auth/confirm-email').send({ email, otp: lastOtpFor(email) }).expect(200);
  const signIn = await api().post('/api/auth/signin').send({ email, password: 'Password123' }).expect(200);
  const { accesstoken, refreshtoken } = signIn.body.data.tokens;
  const profile = await api().get('/api/profile').set('Authorization', `Bearer ${accesstoken}`).expect(200);
  return { email, token: accesstoken as string, refreshToken: refreshtoken as string, id: profile.body.data.data._id as string };
};
