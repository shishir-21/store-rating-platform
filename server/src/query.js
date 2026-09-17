export const safeSort = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
export const direction = (value) => value === 'desc' ? 'DESC' : 'ASC';
export const pagination = (query) => ({ limit: Math.min(Math.max(Number(query.limit) || 20, 1), 100), offset: Math.max(Number(query.offset) || 0, 0) });

