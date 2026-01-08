import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { Test, TestingModule } from '@nestjs/testing';
import { IpSafetyService } from './ip-safety.service';
import { LookupAddress, LookupAllOptions } from 'node:dns';

describe('IpSafetyService', () => {
  let ipSafetyService: IpSafetyService;

  beforeEach(async () => {
    ipSafetyService = new IpSafetyService();
  });

  describe('isPrivateIp()', () => {
    it('should return true if ip is in private range', async () => {
      const url = 'http://example.com';

      const lookupSpy = jest.spyOn(
        dns,
        'lookup',
      ) as unknown as jest.MockedFunction<
        (
          hostname: string,
          options: LookupAllOptions,
        ) => Promise<LookupAddress[]>
      >;
      jest
        .spyOn(ipaddr, 'parse')
        .mockReturnValue({ range: () => 'private' } as unknown as ipaddr.IPv4);

      const result = await ipSafetyService.isPrivateIp(url);
      expect(result).toBe(true);
    });

    it('should return false if ip is not in private range', async () => {
      const url = 'http://example.com';

      const lookupSpy = jest.spyOn(
        dns,
        'lookup',
      ) as unknown as jest.MockedFunction<
        (
          hostname: string,
          options: LookupAllOptions,
        ) => Promise<LookupAddress[]>
      >;
      jest
        .spyOn(ipaddr, 'parse')
        .mockReturnValue({
          range: () => 'broadcast',
        } as unknown as ipaddr.IPv4);

      const result = await ipSafetyService.isPrivateIp(url);
      expect(result).toBe(false);
    });

    it('should strip [] if url is in ipv6 format', async () => {
      const url = 'http://[::1]';

      const lookupSpy = jest.spyOn(dns, 'lookup');
      jest.spyOn(ipaddr, 'parse');

      const result = await ipSafetyService.isPrivateIp(url);
      expect(lookupSpy).toHaveBeenCalledWith('::1', { all: true });
    });

    it('should return true if bad url is passed', async () => {
      const url = 'badurl';

      const result = await ipSafetyService.isPrivateIp(url);
      expect(result).toBe(true);
    });
  });
});
