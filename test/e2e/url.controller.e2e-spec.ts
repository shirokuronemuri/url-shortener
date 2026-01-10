import request from 'supertest';
import { server, app } from '../setup';
import { TypedConfigService } from 'src/config/typed-config.service';
import { DatabaseService } from 'src/services/database/database.service';
import { populateUrlsPayload } from '../test-utils';

describe('UrlController (e2e)', () => {
  let token: string;
  let adminSecret: string;

  const populateUrls = async ({
    youtubeLinks = 8,
    googleLinks = 7,
    useDifferentToken = false,
  } = {}) => {
    let passedToken = token;
    if (useDifferentToken) {
      const res = await request(server)
        .post('/token')
        .set('x-admin-secret', adminSecret);
      passedToken = res.body.data.token;
    }
    const data = populateUrlsPayload(passedToken.split('.')[0]!, {
      youtubeLinks,
      googleLinks,
    });
    const db = app.get(DatabaseService);
    const result = db.url.createManyAndReturn({ data });
    return result;
  };

  const populateUrl = async ({ useDifferentToken = false } = {}) => {
    const url = (
      await populateUrls({
        youtubeLinks: 1,
        googleLinks: 0,
        useDifferentToken,
      })
    )[0]!;

    return JSON.parse(JSON.stringify(url)) as typeof url;
  };

  beforeAll(() => {
    const config = app.get(TypedConfigService);
    adminSecret = config.get('app.adminSecret');
  });

  beforeEach(async () => {
    const res = await request(server)
      .post('/token')
      .set('x-admin-secret', adminSecret);
    token = res.body.data.token;
  });

  describe('POST /url', () => {
    it('returns 201 and new url', async () => {
      await request(server)
        .post('/url')
        .send({ title: 'Google', redirect: 'https://google.com' })
        .set('x-api-key', token)
        .expect(201)
        .expect(({ body: { data } }) => {
          expect(data).toMatchObject({
            redirect: 'https://google.com',
            title: 'Google',
            description: null,
          });
          expect(data).toHaveProperty('url');
        });
    });

    it('returns 400 if missing required field', async () => {
      await request(server)
        .post('/url')
        .send({ title: 'Google' })
        .set('x-api-key', token)
        .expect(400);
    });
    it('returns 403 if token missing', async () => {
      await request(server)
        .post('/url')
        .send({ title: 'Google', redirect: 'https://google.com' })
        .expect(403);
    });

    it('returns 403 if token is wrong', async () => {
      await request(server)
        .post('/url')
        .send({ title: 'Google', redirect: 'https://google.com' })
        .set('x-api-key', 'wrongtoken')
        .expect(403);
    });
  });

  describe('GET /url', () => {
    it('returns list of urls with query params applied without filter and meta is correct', async () => {
      await populateUrls();
      await request(server)
        .get('/url')
        .set('x-api-key', token)
        .query({ limit: 10, page: 1 })
        .expect(200)
        .expect(({ body: { data, meta } }) => {
          expect(data).toHaveLength(10);
          expect(meta).toMatchObject({
            totalCount: 15,
            currentPage: 1,
            totalPages: 2,
            perPage: 10,
            nextPage: expect.any(String),
            previousPage: null,
          });
        });
    });

    it('returns list of urls with filter provided', async () => {
      await populateUrls({ googleLinks: 4, youtubeLinks: 0 });
      await request(server)
        .get('/url')
        .set('x-api-key', token)
        .query({ limit: 10, page: 1, filter: 'google' })
        .expect(200)
        .expect(({ body: { data, meta } }) => {
          expect(data).toHaveLength(4);
        });
    });

    it('isolates values under different tokens', async () => {
      await populateUrls({
        youtubeLinks: 2,
        googleLinks: 0,
      });
      await populateUrls({
        youtubeLinks: 10,
        googleLinks: 0,
        useDifferentToken: true,
      });
      await request(server)
        .get('/url')
        .set('x-api-key', token)
        .query({ limit: 20, page: 1 })
        .expect(200)
        .expect(({ body: { data, meta } }) => {
          expect(data).toHaveLength(2);
        });
    });

    it('returns 403 if unauthorized', async () => {
      await populateUrls();
      await request(server)
        .get('/url')
        .query({ limit: 10, page: 1 })
        .expect(403);
    });
  });

  describe('GET /url/:id', () => {
    it('returns url when owned', async () => {
      const dbUrl = await populateUrl();
      await request(server)
        .get(`/url/${dbUrl.url}`)
        .set('x-api-key', token)
        .expect(200)
        .expect(({ body: { data } }) => {
          expect(dbUrl).toMatchObject(data);
        });
    });

    it("returns 404 when url doesn't exist", async () => {
      await request(server)
        .get('/url/nonexisting')
        .set('x-api-key', token)
        .expect(404);
    });

    it('returns 404 when owned by other user', async () => {
      const dbUrl = await populateUrl({ useDifferentToken: true });
      await request(server)
        .get(`/url/${dbUrl.url}`)
        .set('x-api-key', token)
        .expect(404);
    });

    it('returns 403 when unauthorized', async () => {
      const dbUrl = await populateUrl();
      await request(server).get(`/url/${dbUrl.url}`).expect(403);
    });
  });

  describe('GET /:id', () => {
    it('redirects to url', async () => {
      const dbUrl = await populateUrl();
      await request(server).get(`/${dbUrl.url}`).expect(302);
    });

    it("returns 404 if url doesn't exist", async () => {
      await request(server).get('/nonexisting').expect(404);
    });
  });

  describe('PATCH /url/:id', () => {
    it('returns 200 and updates url', async () => {
      const dbUrl = await populateUrl();
      await request(server)
        .patch(`/url/${dbUrl.url}`)
        .set('x-api-key', token)
        .send({
          title: 'updated',
        })
        .expect(200)
        .expect(({ body: { data } }) => {
          expect(data.title).toBe('updated');
        });
    });

    it('returns 400 on invalid payload', async () => {
      const dbUrl = await populateUrl();
      await request(server)
        .patch(`/url/${dbUrl.url}`)
        .set('x-api-key', token)
        .send({
          redirect: true,
        })
        .expect(400);
    });

    it("returns 404 if editing other user's url", async () => {
      const dbUrl = await populateUrl({ useDifferentToken: true });
      await request(server)
        .patch(`/url/${dbUrl.url}`)
        .set('x-api-key', token)
        .send({
          title: 'updated',
        })
        .expect(404);
    });

    it('returns 403 if unauthorized', async () => {
      const dbUrl = await populateUrl();
      await request(server)
        .patch(`/url/${dbUrl.url}`)
        .send({
          title: 'updated',
        })
        .expect(403);
    });
  });

  describe('DELETE /url/:id', () => {
    it('deletes the url', async () => {
      const dbUrl = await populateUrl();
      await request(server)
        .delete(`/url/${dbUrl.url}`)
        .set('x-api-key', token)
        .expect(204);
      await request(server)
        .get(`/url/${dbUrl.url}`)
        .set('x-api-key', token)
        .expect(404);
    });
    it("returns 404 if url doesn't exist", async () => {
      await request(server)
        .delete('/url/nonexisting')
        .set('x-api-key', token)
        .expect(404);
    });
    it("returns 404 if url isn't yours", async () => {
      const dbUrl = await populateUrl({ useDifferentToken: true });
      await request(server)
        .get(`/url/${dbUrl.url}`)
        .set('x-api-key', token)
        .expect(404);
    });
    it('returns 403 if unauthorized', async () => {
      const dbUrl = await populateUrl();
      await request(server).get(`/url/${dbUrl.url}`).expect(403);
    });
  });
});
