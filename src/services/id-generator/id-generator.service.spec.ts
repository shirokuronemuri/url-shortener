import { IdGeneratorService } from './id-generator.service';
import { nanoid } from 'nanoid';
jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

describe('IdGeneratorService', () => {
  let idGeneratorService: IdGeneratorService;

  beforeEach(() => {
    idGeneratorService = new IdGeneratorService();
  });

  describe('generate()', () => {
    it('should call nanoid with provided length', () => {
      (nanoid as jest.Mock).mockReturnValue('abc');
      const result = idGeneratorService.generate(8);
      expect(nanoid).toHaveBeenCalledWith(8);
      expect(result).toBe('abc');
    });
  });
});
