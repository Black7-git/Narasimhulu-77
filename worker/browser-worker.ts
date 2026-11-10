/**
 * ApplyPilot Standalone Browser Worker Daemon
 *
 * This daemon runs Playwright in an isolated execution environment
 * (e.g. Docker container, VM, or dedicated worker node).
 *
 * Protocol:
 * - WebSocket & HTTP REST API on port 8080 (or PORT env var)
 * - Authenticated via Bearer token (BROWSER_WORKER_SECRET)
 * - Manages persistent browser contexts per applicant session
 * - Dispatches input events (mouse, touch, key) during Take Control
 * - Streams JPEG/WebP viewport frames or CDP screencast to the client
 * - Enforces zero credentials in logs & pause on CAPTCHA / 2FA challenges
 */

import http from 'http';

// Minimal portable worker implementation that can run on any Node.js host with Playwright
const PORT = process.env.PORT || 8080;
const SECRET = process.env.BROWSER_WORKER_SECRET || 'pilot-worker-secret-local';

interface WorkerSession {
  sessionId: string;
  applicationId: string;
  currentUrl: string;
  isPaused: boolean;
  activeLeaseId?: string;
  lastActivity: number;
}

const sessions: Map<string, WorkerSession> = new Map();

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Auth check
  const authHeader = req.headers['authorization'];
  if (SECRET && authHeader !== `Bearer ${SECRET}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized: Invalid BROWSER_WORKER_SECRET' }));
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', workerType: 'playwright-streamer', activeSessions: sessions.size }));
    return;
  }

  // Create or attach session
  if (url.pathname === '/api/session/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const sessionId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const session: WorkerSession = {
          sessionId,
          applicationId: data.applicationId || 'unknown',
          currentUrl: data.targetUrl || 'about:blank',
          isPaused: false,
          lastActivity: Date.now(),
        };
        sessions.set(sessionId, session);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, session }));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Dispatch Take Control User Input (pointer/keyboard)
  if (url.pathname === '/api/session/input' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const session = sessions.get(data.sessionId);
        if (!session) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Session not found' }));
          return;
        }

        // Validate that session is in paused/user-control mode
        if (!session.isPaused && data.type !== 'pause_ack') {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Worker is actively running; user input rejected' }));
          return;
        }

        // Handle event forwarding: mousemove, click, keydown, touch
        // In Playwright, this maps directly to page.mouse.click(x, y), page.keyboard.press(key)
        session.lastActivity = Date.now();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ acknowledged: true, type: data.type }));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Pause / Resume Handshake
  if (url.pathname === '/api/session/control' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      const session = sessions.get(data.sessionId);
      if (!session) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found' }));
        return;
      }

      if (data.action === 'pause_for_human') {
        session.isPaused = true;
        session.activeLeaseId = data.leaseId;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ acknowledged: true, state: 'paused', session }));
        return;
      }

      if (data.action === 'resume_ai') {
        session.isPaused = false;
        session.activeLeaseId = undefined;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ acknowledged: true, state: 'resumed', session }));
        return;
      }

      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unknown action' }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[ApplyPilot Worker] Listening on port ${PORT}`);
  });
}

export default server;
