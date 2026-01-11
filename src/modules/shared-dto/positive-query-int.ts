import z from 'zod';

export const positiveQueryInt = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  const num = Number(val);
  return Number.isNaN(num) ? val : num;
}, z.number().int().positive());
