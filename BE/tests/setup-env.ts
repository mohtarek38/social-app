// Test environment variables (the real .env is never used in tests)
process.env.NODE_ENV = 'test';
process.env.SALT_ROUNDS = '4';
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
process.env.IV_LENGTH = '16';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRATION = '30min';
process.env.JWT_REFRESH_EXPIRATION = '1d';
process.env.JWT_PREFIX = 'Bearer';
process.env.CORS_WHITELIST = 'http://localhost:5500,http://127.0.0.1:5500';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.AWS_REGION = 'eu-north-1';
process.env.BUCKET_NAME = 'test-bucket';
process.env.AWS_S3_KEY_FOLDER = 'test';

// Keep the test output clean (the email emitter logs every OTP)
jest.spyOn(console, 'log').mockImplementation(() => {});
