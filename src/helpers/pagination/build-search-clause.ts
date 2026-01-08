export const buildSearchClause = <T extends object>(
  filter: string | undefined,
  fields: (keyof T)[],
) => {
  if (!filter || fields.length === 0) {
    return undefined;
  }

  return {
    OR: fields.map((field) => ({
      [field]: { contains: filter, mode: 'insensitive' },
    })),
  };
};
