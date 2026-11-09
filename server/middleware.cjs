/**
 * Custom middleware for json-server (v0.17.4).
 * Provides header inspection and optional error simulation.
 */
module.exports = (req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'X-Total-Count, X-Active-User');

  const activeUserId = req.headers['x-user-id'] || 'anonymous';
  res.header('X-Active-User', activeUserId);

  if (
    req.query.simulateError === 'true' ||
    (req.body && typeof req.body.title === 'string' && req.body.title.includes('[SIMULATE_ERROR]'))
  ) {
    return res.status(500).json({
      message: 'Simulated 500 Internal Server Error from json-server middleware.',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
