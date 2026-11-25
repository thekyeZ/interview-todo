/**
 * Custom middleware for json-server (v0.17.4).
 * Exposes user context headers and supports optional server error simulation.
 */
module.exports = (req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'X-Total-Count, X-Active-User');

  const activeUserId = req.headers['x-user-id'] || 'anonymous';
  res.header('X-Active-User', activeUserId);

  const searchQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (
    req.query.simulateError === 'true' ||
    searchQuery.includes('[SIMULATE_ERROR]') ||
    searchQuery.toLowerCase() === 'error' ||
    (req.body && typeof req.body.title === 'string' && req.body.title.includes('[SIMULATE_ERROR]'))
  ) {
    return res.status(500).json({
      message: 'Simulated 500 Internal Server Error from json-server middleware.',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
