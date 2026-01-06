import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AdminGuard } from './admin.guard';
import { TypedConfigService } from 'src/config/typed-config.service';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

describe('AdminGuard', () => {
  let adminGuard: AdminGuard;
  let config: DeepMockProxy<TypedConfigService>;

  const mockExecutionContext = (req: Partial<Request>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    config = mockDeep<TypedConfigService>();
    adminGuard = new AdminGuard(config);
  });

  it('should return false if x-admin-secret is not passed', async () => {
    const req = { headers: {} };
    const context = mockExecutionContext(req);
    config.get.mockReturnValue('secret');

    const result = await adminGuard.canActivate(context);

    expect(result).toBe(false);
  });

  it("should return false if x-admin-secret doesn't match", async () => {
    const req = { headers: { 'x-admin-secret': 'wrongsecret' } };
    const context = mockExecutionContext(req);
    config.get.mockReturnValue('secret');

    const result = await adminGuard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should return true if x-admin-secret matches', async () => {
    const req = { headers: { 'x-admin-secret': 'secret' } };
    const context = mockExecutionContext(req);
    config.get.mockReturnValue('secret');

    const result = await adminGuard.canActivate(context);

    expect(result).toBe(true);
  });
});
