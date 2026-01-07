import { DatabaseService } from 'src/services/database/database.service';
import { TokenService } from '../../token.service';
import { AuthGuard } from './auth.guard';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Request } from 'express';
import { ExecutionContext } from '@nestjs/common';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let tokenService: DeepMockProxy<TokenService>;
  let db: DeepMockProxy<DatabaseService>;

  const mockExecutionContext = (req: Partial<Request>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    tokenService = mockDeep<TokenService>();
    db = mockDeep<DatabaseService>();
    authGuard = new AuthGuard(tokenService, db);
  });

  it('should return false if x-api-key is not passed', async () => {
    const req = { headers: {} };
    const context = mockExecutionContext(req);

    const result = await authGuard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should return false if x-api-key format is invalid', async () => {
    const req = { headers: { 'x-api-key': 'invalidformat' } };
    const context = mockExecutionContext(req);

    const result = await authGuard.canActivate(context);

    expect(result).toBe(false);
  });

  it("should return false if token doesn't exist in db", async () => {
    tokenService.hashValue.mockReturnValue('hashed-secret');
    db.token.findUnique.mockResolvedValue(null);
    const req = { headers: { 'x-api-key': 'tokenId.secret' } };
    const context = mockExecutionContext(req);

    const result = await authGuard.canActivate(context);

    expect(db.token.findUnique).toHaveBeenCalledWith({
      where: { id: 'tokenId' },
    });
    expect(result).toBe(false);
  });

  it('should return true if token matches and attach tokenId to req', async () => {
    tokenService.hashValue.mockReturnValue('hashed-secret');
    db.token.findUnique.mockResolvedValue({
      id: 'tokenId',
      hash: 'hashed-secret',
      isRevoked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const req: Partial<Request> = {
      headers: { 'x-api-key': 'tokenId.secret' },
    };
    const context = mockExecutionContext(req);

    const result = await authGuard.canActivate(context);

    expect(db.token.findUnique).toHaveBeenCalledWith({
      where: { id: 'tokenId' },
    });
    expect(result).toBe(true);
    expect(req.tokenId).toBe('tokenId');
  });
});
