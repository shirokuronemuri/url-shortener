import z from 'zod';

export const defaultSchema = z.object({
  id: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
