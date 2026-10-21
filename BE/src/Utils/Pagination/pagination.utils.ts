export const getPagination = (page = 1, limit = 10) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);

  return {
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};
