import { nanoid } from 'nanoid';

export const populateUrlsPayload = (
  tokenId: string,
  {
    googleLinks,
    youtubeLinks,
  }: { googleLinks: number; youtubeLinks: number } = {
    googleLinks: 8,
    youtubeLinks: 7,
  },
) => [
  ...Array.from({ length: googleLinks }, (_, i) => ({
    redirect: 'https://google.com',
    url: nanoid(8),
    title: 'Google',
    tokenId,
  })),
  ...Array.from({ length: youtubeLinks }, (_, i) => ({
    redirect: 'https://youtube.com',
    url: nanoid(8),
    title: 'Youtube',
    tokenId,
  })),
];
