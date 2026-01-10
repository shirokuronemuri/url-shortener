import request from 'supertest';
import { server, app } from '../setup';
import { TypedConfigService } from 'src/config/typed-config.service';

describe('TokenController (e2e)', () => {
  let adminSecret: string;

  beforeAll(() => {
    const config = app.get(TypedConfigService);
    adminSecret = config.get('app.adminSecret');
  });

  describe('POST /token', () => {
    it('should generate new token', async () => {
      await request(server)
        .post('/token')
        .set('x-admin-secret', adminSecret)
        .expect(201)
        .expect(({ body: { data } }) => {
          expect(data.token).toBeDefined();
        });
    });
    it('should return 403 if unauthorized', async () => {
      await request(server).post('/token').expect(403);
    });
  });

  describe('DELETE /token', () => {
    it('should revoke the token', async () => {
      const tokenId: string = (
        await request(server).post('/token').set('x-admin-secret', adminSecret)
      ).body.data.token.split('.')[0];
      await request(server)
        .delete(`/token/${tokenId}`)
        .set('x-admin-secret', adminSecret)
        .expect(204);
    });
    it('should return 404 if token not found', async () => {
      await request(server)
        .delete('/token/nonexisting')
        .set('x-admin-secret', adminSecret)
        .expect(404);
    });
    it('should return 403 if unauthorized', async () => {
      const tokenId: string = (
        await request(server).post('/token').set('x-admin-secret', adminSecret)
      ).body.data.token.split('.')[0];
      await request(server).delete(`/token/${tokenId}`).expect(403);
    });
  });
});
