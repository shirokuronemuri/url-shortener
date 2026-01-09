export const populateUrlsPayload = (tokenId: string) => [
  ...Array.from({ length: 8 }, (_, i) => ({
    redirect: 'https://google.com',
    url: `google-${i}`,
    title: 'Google',
    tokenId,
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    redirect: 'https://youtube.com',
    url: `youtube-${i}`,
    title: 'Youtube',
    tokenId,
  })),
];
