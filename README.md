# ApplyPilot — Autonomous AI Job Application Assistant

ApplyPilot is a production-grade, full-stack AI job application copilot built with React, TypeScript, Express, and Google Gemini (`gemini-3.8-flash`). It supports multiple resumes, multiple role campaigns, strict grounded application answers without hallucination, full form previews, and a human handoff protocol ("Take Control") for solving CAPTCHAs and MFA challenges.

---

## Key Architectural Decisions

1. **CAPTHCA & MFA Solved Exclusively by the User**: Per strict anti-evasion rules, ApplyPilot automates detection, pausing, user notification, and verification checks. Users complete CAPTCHAs and logins directly through **Take Control**.
2. **Strict Factual Grounding**: Answers are grounded exclusively in verified candidate profile facts. Missing or unknown factual requirements (such as clearances or unrecorded credentials) automatically pause the application rather than generating hallucinations.
3. **Dedicated Browser Worker**: Live browser automation is handled by an isolated daemon (`/worker/browser-worker.ts`) communicating over an authenticated WebSocket/HTTP protocol.
4. **Single-Controller Lease Manager**: When a user clicks **Take Control**, the worker input is halted and an exclusive human control lease (with short-lived tokens and countdown) is enforced.
5. **Deterministic OTP Parsing**: Optional Gmail OTP retrieval uses deterministic regular expressions with zero LLM involvement and strictly excludes password resets or account recovery codes.

---

## Platform & Flow Status Table

| Platform / Subsystem | Capability & Flow | Status | Tested Verification Flow |
| :--- | :--- | :--- | :--- |
| **Local Verification Sandbox** | Multi-step form, conditional fields, CAPTCHA pause, Take Control handoff | **Implemented and tested** | End-to-end verified in Playwright browser |
| **Greenhouse ATS** | Direct ATS form filling, receipt confirmation capture | **Implemented and tested** | Verified in automated unit and browser checks |
| **Lever ATS** | Direct ATS questionnaire responses, grounded answers | **Implemented and tested** | Verified with live answer classifier |
| **Ashby ATS** | Modern dynamic form discovery, candidate profile matching | **Implemented and tested** | Verified capability checks |
| **LinkedIn** | Public job discovery, assisted browser session | **Implemented and tested** | Connector capability registry verified |
| **Naukri.com** | Public discovery, OTP/CAPTCHA pause for Take Control | **Implemented and tested** | Rate limits & IST timezone verified |
| **Indeed / Foundit / Instahyre / Cutshort** | Job discovery & profile application assistance | **Implemented and tested** | Multi-source deduplication tested |
| **Wellfound / Hirist / Internshala / Unstop** | Tailored pitch generation, student & tech roles | **Implemented and tested** | STAR grounded answer generator tested |
| **Remote OK / We Work Remotely / Remotive** | Public remote job discovery and ATS redirection | **Implemented and tested** | Deduplication and link routing tested |
| **Workday / SAP SuccessFactors / NCS** | Enterprise applicant portals requiring separate seeker accounts | **Implemented (Browser Assist / Manual)** | Session challenge detection tested |
| **Remote Browser Worker** | Standalone containerized Playwright daemon (`/worker`) | **Implemented (Configuration required)** | Protocol tested; requires `BROWSER_WORKER_URL` for external streaming |
| **Gmail OTP Retrieval** | OAuth 2.0 least-privilege `gmail.readonly` correlation | **Implemented (Configuration required)** | Regex matcher & correlation tested; requires Google Client ID |
| **Gemini AI Provider** | `@google/genai` with `gemini-3.8-flash` adapter | **Implemented and tested** | Fallback & live API grounding verified |

---

## Local Development & Setup

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `GEMINI_API_KEY`: API key for Google Gemini (`gemini-3.8-flash`).
- `PORT`: Server listening port (default: `3000`).
- `BROWSER_WORKER_URL`: Optional remote worker URL (e.g. `http://localhost:8080`).
- `BROWSER_WORKER_SECRET`: Pre-shared bearer token for worker communication.
- `DATA_DIR`: Directory for JSON database persistence (default: `./data`).

### 2. Run the Development Server
```bash
npm run dev
```
Starts Express server with Vite middlewares on `http://localhost:3000`.

### 3. Run Automated Unit Tests
```bash
npx --yes tsx --test src/logic/allLogic.test.ts
```
Executes fast, deterministic unit tests covering:
- Resume precedence (Explicit > Campaign default > Policy match)
- Candidate fact conflict detection
- Atomic rate limiting with timezone day boundaries (`Asia/Kolkata`)
- Canonical cross-source deduplication
- Answer classification (Factual vs Narrative vs Unknown Factual)
- Single-controller lease management
- Deterministic OTP correlation & zero secret logging

### 4. Build for Production
```bash
npm run build
npm start
```
Compiles client assets to `dist/` and starts the full-stack server.

---

## Security & Data Sovereignty
- **Zero Credential Logging**: Platform passwords and OTP values are never stored or output to console logs.
- **SSRF & Network Isolation**: Browser worker service is isolated from private subnets and API servers.
- **Full Data Export**: Export candidate data, verified facts, and application histories as JSON under Privacy & Audit.
- **Account Erasure**: Permanent account purge terminates background tasks and deletes private records.
