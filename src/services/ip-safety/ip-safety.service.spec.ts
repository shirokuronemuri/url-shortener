import { Test, TestingModule } from '@nestjs/testing';
import { IpSafetyService } from './ip-safety.service';

describe('IpSafetyService', () => {
  let service: IpSafetyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IpSafetyService],
    }).compile();

    service = module.get<IpSafetyService>(IpSafetyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
