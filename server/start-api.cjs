const net = require('net');
const path = require('path');
const jsonServer = require('json-server');
const customMiddleware = require('./middleware.cjs');

const API_PORT = 3000;
const UI_PORT = 4200;
const DELAY_MS = process.argv.includes('--no-delay') ? 0 : 400;

function startJsonServer() {
  const server = jsonServer.create();
  const router = jsonServer.router(path.join(__dirname, '..', 'db.json'));
  const middlewares = jsonServer.defaults({ logger: true });

  server.use(middlewares);
  server.use(jsonServer.bodyParser);
  if (DELAY_MS > 0) {
    server.use((req, res, next) => {
      setTimeout(next, DELAY_MS);
    });
  }
  server.use(customMiddleware);
  server.use(router);

  server.listen(API_PORT, () => {
    console.log(
      `[JSON-API] Mock API listening on http://localhost:${API_PORT} (delay: ${DELAY_MS}ms)`,
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
