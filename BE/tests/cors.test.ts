import { api } from './helpers';
import { getCorsWhitelist, isOriginAllowed } from '../src/Utils/utils.barrel';

describe('CORS whitelist', () => {
  const original = process.env.CORS_WHITELIST;
  afterEach(() => {
    process.env.CORS_WHITELIST = original;
  });

  it('parses a comma separated list', () => {
    process.env.CORS_WHITELIST = 'http://localhost:5500, https://example.com';
    expect(getCorsWhitelist()).toEqual(['http://localhost:5500', 'https://example.com']);
  });

  it('parses an array style value', () => {
    process.env.CORS_WHITELIST = `['http://localhost:4200',"http://localhost:5500",]`;
    expect(getCorsWhitelist()).toEqual(['http://localhost:4200', 'http://localhost:5500']);
  });

  it('allows requests without an origin', () => {
    expect(isOriginAllowed(undefined)).toBe(true);
  });

  it('sends the CORS header only to whitelisted origins', async () => {
    const allowed = await api().get('/api/posts/home').set('Origin', 'http://localhost:5500');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5500');

    const blocked = await api().get('/api/posts/home').set('Origin', 'http://evil.example');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
