import request from 'supertest';
import { server } from './setup';

describe('AppController (e2e)', () => {
  it('/ (GET)', () => {
    return request(server)
      .get('/')
      .expect(200)
      .expect(({ body }: { body: { data: string } }) => {
        expect(body.data).toBe('Put in cache!');
      });
  });
});
