const net = require('net');
const path = require('path');
const jsonServer = require('json-server');
const customMiddleware = require('./middleware.cjs');

const API_PORT = 3000;
const UI_PORT = 4200;
const DEFAULT_DELAY_MS = process.argv.includes('--no-delay') ? 0 : 400;

function resolveLatencyMs(req) {
  if (DEFAULT_DELAY_MS === 0) {
    return 0;
  }

  if (req.method === 'GET' && typeof req.query.q === 'string' && req.query.q.trim().length > 0) {
    const queryLength = req.query.q.trim().length;
    if (queryLength === 1) {
      return 1800;
    }
    if (queryLength === 2) {
      return 1000;
    }
    return 150;
  }

  if (req.method === 'PATCH') {
    return 1200;
  }

  if (req.method === 'DELETE') {
    return 1600;
  }

  return DEFAULT_DELAY_MS;
}

function startJsonServer() {
  const server = jsonServer.create();
  const router = jsonServer.router(path.join(__dirname, '..', 'db.json'));
  const middlewares = jsonServer.defaults({ logger: true });

  server.use(middlewares);
  server.use(jsonServer.bodyParser);
  server.use((req, res, next) => {
    const delay = resolveLatencyMs(req);
    if (delay > 0) {
      setTimeout(next, delay);
    } else {
      next();
    }
  });
  server.use(customMiddleware);
  server.use(router);

  server.listen(API_PORT, () => {
    console.log(
      `[JSON-API] Mock API listening on http://localhost:${API_PORT} (delay: ${DEFAULT_DELAY_MS}ms)`,
    );
  });
}

/**
 * Waits until Angular dev-server binds port 4200 so that cloud sandboxes
 * (e.g. StackBlitz WebContainers) attach the preview to port 4200 first.
 */
function waitForUiPortAndStart(maxWaitMs = 25000) {
  const startTime = Date.now();

  const checkPort = () => {
    const socket = new net.Socket();
    socket.setTimeout(200);

    socket.once('connect', () => {
      socket.destroy();
      startJsonServer();
    });

    const onFail = () => {
      socket.destroy();
      if (Date.now() - startTime >= maxWaitMs) {
        startJsonServer();
      } else {
        setTimeout(checkPort, 150);
      }
    };

    socket.once('error', onFail);
    socket.once('timeout', onFail);
    socket.connect(UI_PORT, '127.0.0.1');
  };

  checkPort();
}

if (process.argv.includes('--immediate')) {
  startJsonServer();
} else {
  waitForUiPortAndStart();
}
