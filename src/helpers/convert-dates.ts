type DateFieldsToString<T> = Omit<T, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

/**
 * Helper that is required to avoid issue with Date type incompatibility in nestjs-zod's JSON Schema
 * https://github.com/BenLorantfy/nestjs-zod/issues/184
 *
 * @param value return value of any service
 * @returns object with createdAt and updatedAt converted to an ISO string
 */
export const convertDates = <T extends { createdAt: Date; updatedAt: Date }>(
  value: T,
): DateFieldsToString<T> => {
  return {
    ...value,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
};
