import 'express';

declare module 'express' {
  export interface Request {
    // Passed from guard through the decorator
    tokenId?: string;
  }
}
