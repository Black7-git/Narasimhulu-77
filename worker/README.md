# ApplyPilot Browser Worker Service

This service provides an isolated, persistent browser execution environment for permitted live job applications, authenticated logins, and real-time Take Control streaming.

## Why a Separate Worker Service?

Interactive browser sessions require:
1. Persistent Chromium processes retaining session cookies, local storage, and open DOM tabs.
2. Low-latency input event streaming (mouse move, click, drag, keyboard, mobile touch mapping).
3. Hard physical isolation: Employer sites and untrusted web forms are isolated from the main ApplyPilot API server.
4. Strict safety policies: Zero credential logging, network egress sandboxing, and immediate pause on CAPTCHA / MFA challenges.

## Deployment Options

### Option 1: Docker Container (Recommended)

```dockerfile
FROM mcr.microsoft.com/playwright:v1.45.0-jammy
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=8080
ENV BROWSER_WORKER_SECRET="your-high-entropy-secret"
EXPOSE 8080
CMD ["npx", "tsx", "browser-worker.ts"]
```

Build and run:
```bash
docker build -t applypilot-worker .
docker run -p 8080:8080 -e BROWSER_WORKER_SECRET="your-secret" applypilot-worker
```

### Option 2: Cloud Run / ECS / Fly.io

1. Deploy the Docker image to your container platform.
2. Set `BROWSER_WORKER_SECRET` in environment variables.
3. In the ApplyPilot main applet configuration, configure:
   ```env
   BROWSER_WORKER_URL="https://worker.your-domain.com"
   BROWSER_WORKER_SECRET="your-secret"
   ```

## Protocol Specification

### 1. `POST /api/session/create`
Creates an isolated Chromium context for an applicant application flow.
- Header: `Authorization: Bearer <BROWSER_WORKER_SECRET>`
- Body: `{ applicationId: string, targetUrl: string }`
- Response: `{ success: true, session: { sessionId, currentUrl, isPaused } }`

### 2. `POST /api/session/control`
Acquires or releases pause state during Take Control handoff.
- Actions:
  - `pause_for_human`: Halts worker execution; prepares viewport streaming for human.
  - `resume_ai`: Confirms human return; runs post-intervention state verification before resuming.

### 3. `POST /api/session/input`
Dispatches human pointer and keyboard events when the session is leased to the user.
- Events supported:
  - `mousemove`: `{ x: number, y: number }`
  - `click`: `{ x: number, y: number, button: 'left'|'right' }`
  - `keypress`: `{ key: string, code: string }`
  - `touch`: scaled viewport coordinates for mobile devices.

### 4. Health Check
`GET /health` -> `{ status: "ok", activeSessions: number }`
