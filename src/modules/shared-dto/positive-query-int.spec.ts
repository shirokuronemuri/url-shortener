import { positiveQueryInt } from './positive-query-int';

describe('positiveQueryInt schema', () => {
  it('accepts positive int strings', () => {
    const result = positiveQueryInt.safeParse('12');
    expect(result.success).toBe(true);
  });
  it('rejects negative values', () => {
    const result = positiveQueryInt.safeParse('-1');
    expect(result.success).toBe(false);
  });
  it('rejects non-ints', () => {
    const result = positiveQueryInt.safeParse('1.5');
    expect(result.success).toBe(false);
  });
  it('rejects non-numbers', () => {
    const result = positiveQueryInt.safeParse('nyaa');
    expect(result.success).toBe(false);
  });
  it('rejects empty string', () => {
    const result = positiveQueryInt.safeParse('');
    expect(result.success).toBe(false);
  });
  it('passes numbers through', () => {
    const result = positiveQueryInt.safeParse(8);
    expect(result.success).toBe(true);
  });
});
