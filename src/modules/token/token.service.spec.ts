jest.mock('src/helpers/prisma/prisma-unique-constraint', () => ({
  isPrismaUniqueConstraintError: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { DatabaseService } from 'src/services/database/database.service';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { TypedConfigService } from 'src/config/typed-config.service';
import crypto from 'node:crypto';
import { isPrismaUniqueConstraintError } from 'src/helpers/prisma/prisma-unique-constraint';
import { InternalServerErrorException } from '@nestjs/common';

describe('TokenService', () => {
  let tokenService: TokenService;

  let db: DeepMockProxy<DatabaseService>;
  let idGenerator: DeepMockProxy<IdGeneratorService>;
  let config: DeepMockProxy<TypedConfigService>;

  beforeEach(async () => {
    db = mockDeep<DatabaseService>();
    idGenerator = mockDeep<IdGeneratorService>();
    config = mockDeep<TypedConfigService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: DatabaseService,
          useValue: db,
        },
        {
          provide: IdGeneratorService,
          useValue: idGenerator,
        },
        {
          provide: TypedConfigService,
          useValue: config,
        },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
  });

  describe('hashValue()', () => {
    it('returns same hash for same input', () => {
      expect(tokenService.hashValue('a')).toEqual(tokenService.hashValue('a'));
    });

    it('returns different hash for different input', () => {
      expect(tokenService.hashValue('a')).not.toEqual(
        tokenService.hashValue('b'),
      );
    });
  });

  describe('generateToken()', () => {
    it('should generate and store a token', async () => {
      jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from('secret'));

      config.get.mockReturnValueOnce(1).mockReturnValueOnce(8);
      idGenerator.generate.mockReturnValue('tokenId');
      db.token.create.mockResolvedValue({
        id: 'tokenId',
        hash: 'hash',
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await tokenService.generateToken();
      expect(result.token).toContain('tokenId.');
      const spy = jest.spyOn(db.token, 'create');
      expect(spy).toHaveBeenCalled();
    });

    it('should rethrow if unknown db error', async () => {
      jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from('secret'));

      config.get.mockReturnValueOnce(1).mockReturnValueOnce(8);
      idGenerator.generate.mockReturnValue('tokenId');
      db.token.create.mockRejectedValue(new Error('db down'));

      await expect(tokenService.generateToken()).rejects.toThrow('db down');
    });

    it('should retry generating token once and succeed', async () => {
      jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from('secret'));

      config.get.mockReturnValueOnce(2).mockReturnValueOnce(8);
      idGenerator.generate.mockReturnValue('tokenId');
      db.token.create
        .mockRejectedValueOnce(new Error('duplicate'))
        .mockResolvedValueOnce({
          id: 'tokenId',
          hash: 'hash',
          isRevoked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      (isPrismaUniqueConstraintError as jest.Mock).mockReturnValueOnce(true);

      const result = await tokenService.generateToken();
      expect(result.token).toContain('tokenId.');
      const spy = jest.spyOn(db.token, 'create');
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should throw internal server exception when over limit', async () => {
      jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from('secret'));

      config.get.mockReturnValueOnce(1).mockReturnValueOnce(8);
      idGenerator.generate.mockReturnValue('tokenId');
      db.token.create.mockRejectedValueOnce(new Error('duplicate'));

      (isPrismaUniqueConstraintError as jest.Mock).mockReturnValueOnce(true);

      await expect(tokenService.generateToken()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('revokeToken()', () => {
    it('should revoke token', async () => {
      const dbObject = {
        id: 'id',
        isRevoked: true,
        hash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.token.update.mockResolvedValue(dbObject);

      const result = await tokenService.revokeToken('id');

      const spy = jest.spyOn(db.token, 'update');
      expect(spy).toHaveBeenCalledWith({
        where: { id: 'id' },
        data: { isRevoked: true },
      });
      expect(result).toBe(dbObject);
    });
  });
});
