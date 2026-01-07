import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IpSafetyService {
  async isPrivateIp(url: string): Promise<boolean> {
    try {
      let hostname = new URL(url).hostname;
      if (hostname.startsWith('[') && hostname.endsWith(']')) {
        hostname = hostname.slice(1, -1);
      }
      const ips = await dns.lookup(hostname, { all: true });
      const privateRanges = [
        'private',
        'loopback',
        'linkLocal',
        'uniqueLocal',
        'unspecified',
        'carrierGradeNat',
      ];
      return ips.some((ip) => {
        const range = ipaddr.parse(ip.address).range();
        return privateRanges.includes(range);
      });
    } catch {
      return true;
    }
  }
}
