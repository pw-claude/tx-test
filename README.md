# CM Transactional Tester

A browser-based testing tool for Campaign Monitor Transactional Emails (Smart & Classic).
Runs on Vercel — no SMTP, no complex setup.

## Why Vercel?

The CM API doesn't allow direct browser requests (CORS). This project uses a tiny Vercel
serverless function (`/api/proxy.js`) that proxies requests server-side — no CORS issues.
The API key is only sent to your own Vercel function, never stored anywhere.

## Deploy to Vercel (2 minutes)

### Option A — Vercel CLI (recommended)

1. Install the Vercel CLI (requires Node.js):
   ```
   npm install -g vercel
   ```

2. In this folder, run:
   ```
   vercel
   ```

3. Follow the prompts (create a free account if needed, accept defaults).

4. Done — Vercel gives you a URL like `https://cm-tester-xyz.vercel.app`

### Option B — Vercel Dashboard (no CLI)

1. Go to https://vercel.com and sign in / create a free account
2. Click **Add New → Project**
3. Click **"Import Third-Party Git Repository"** — or drag and drop this folder
   (Alternatively: push this folder to a GitHub repo and import that)
4. Leave all settings as default and click **Deploy**
5. Done — you'll get a live URL in ~30 seconds

## Usage

1. Open your Vercel URL in any browser
2. Paste your Campaign Monitor API key at the top
3. Use the tabs:
   - **⚡ Smart Email** — load your smart email templates, pick one, add data variables, send
   - **✉️ Classic Email** — compose a full custom email and send
   - **📋 Timeline** — browse recent sends, click to view details or resend
   - **🔍 Message Lookup** — look up any message by ID
   - **📊 Statistics** — delivery & engagement metrics

## Project Structure

```
cm-tester/
├── api/
│   └── proxy.js        ← Vercel serverless function (proxies to CM API)
├── public/
│   └── index.html      ← Frontend UI
├── package.json
└── vercel.json         ← Routing config
```

## Security Notes

- Your API key is sent to the `/api/proxy` function on your own Vercel deployment only
- It is never logged or stored — it is used once per request and discarded
- You can restrict access to the Vercel URL using Vercel's Password Protection (Pro plan)
  or by adding an internal network restriction if needed
