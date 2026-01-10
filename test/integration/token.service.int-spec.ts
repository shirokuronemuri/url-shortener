import { DatabaseService } from '../../src/services/database/database.service';
import { app } from '../setup';
import crypto from 'node:crypto';
import { TokenService } from '../../src/modules/token/token.service';

describe('TokenService', () => {
  let tokenService: TokenService;
  let db: DatabaseService;

  beforeAll(async () => {
    tokenService = app.get(TokenService);
    db = app.get(DatabaseService);
  });

  describe('generateToken()', () => {
    it('should generate token and store it', async () => {
      const result = await tokenService.generateToken();
      const [id, secret] = result.token.split('.');
      const dbToken = await db.token.findUnique({ where: { id } });
      expect(dbToken).not.toBeNull();
      expect(dbToken!.isRevoked).toBe(false);
      expect(dbToken!.hash).toBe(
        crypto.createHash('sha256').update(secret!).digest('hex'),
      );
    });
  });

  describe('revokeToken()', () => {
    it('updates token to revoked', async () => {
      const token = await db.token.create({
        data: {
          id: 'abc',
          hash: 'hash',
        },
      });

      expect(token.isRevoked).toBe(false);
      const revokedToken = await tokenService.revokeToken('abc');
      expect(token.id).toBe(revokedToken.id);
      expect(revokedToken.isRevoked).toBe(true);
    });
  });
});
