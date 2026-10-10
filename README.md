# Meta Lead Realtime

Real-time Meta Lead Ads → React Native demo. When a lead form is submitted via Meta's Lead Ads Testing Tool, the lead appears instantly on an already-open React Native screen — no manual refresh needed.

## Architecture

```
[Meta Lead Ad Form] → [Webhook POST /webhook] → [Meta Graph API] → [Socket.IO] → [React Native App]
                                    ↓
                         [Background Poller] → [Deduplication] → [Socket.IO]
```

- **Webhook path**: Meta sends `leadgen_id` → server fetches full `field_data` via Graph API → broadcasts via Socket.IO
- **Poller path**: Every 5s, server polls `/leads` endpoint → seeds `seenLeadIds` on first run → broadcasts new leads
- **Deduplication**: `seenLeadIds` Set ensures each lead broadcasts exactly once

## Project Structure

```
meta-lead-realtime/
├── backend/          # Express + Socket.IO server
│   ├── index.js
│   └── package.json
├── frontend/         # Expo React Native app
│   ├── App.js
│   ├── config.js
│   ├── index.js
│   ├── app.json
│   ├── assets/
│   └── package.json
├── package.json      # Root scripts (concurrently, ngrok)
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- [ngrok](https://ngrok.com/) (for webhook tunneling)
- [Expo Go](https://expo.dev/go) on physical device

## Getting Started

### 1. Backend

```bash
cd backend
npm install
```

Create `.env` in `backend/`:

```env
PORT=3000
VERIFY_TOKEN=your_verify_token
PAGE_ACCESS_TOKEN=your_page_access_token
FORM_ID=your_form_id
```

Start server:

```bash
npm start
```

### 2. Tunnel (ngrok)

In a separate terminal:

```bash
npm run start:tunnel
# or
npx ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://xxxx.ngrok-free.dev`) and register in Meta App Dashboard → Webhooks → Page → Subscribe:
- **Callback URL**: `https://xxxx.ngrok-free.dev/webhook`
- **Verify Token**: matches `VERIFY_TOKEN`
- Subscribe to `leadgen` field

### 3. Frontend

Update `frontend/config.js` with your ngrok URL:

```js
export const SERVER_URL = 'https://xxxx.ngrok-free.dev';
```

Install and start:

```bash
cd frontend
npm install
npm start
```

Open Expo Go on your phone, scan the QR code. Status badge should show **Live**.

## Testing

### Method A: Meta Lead Ads Testing Tool

1. Open [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing)
2. Select your Page and Form
3. Click **Create lead**
4. Lead appears instantly on the React Native screen

### Method B: Direct Webhook Simulation

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/webhook" -Method POST -ContentType "application/json" -Body '{"object":"page","entry":[{"id":"PAGE_ID","time":1775468400,"changes":[{"field":"leadgen","value":{"ad_id":"0","form_id":"FORM_ID","leadgen_id":"LEAD_ID","created_time":1775468400,"page_id":"PAGE_ID"}}]}]}'
```

**cURL:**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"page","entry":[{"id":"PAGE_ID","time":1775468400,"changes":[{"field":"leadgen","value":{"ad_id":"0","form_id":"FORM_ID","leadgen_id":"LEAD_ID","created_time":1775468400,"page_id":"PAGE_ID"}}]}]}'
```

## Expected Lead Fields

The form returns these fields (adjust `App.js` card rendering if your form differs):

- `full_name` — user's full name
- `email` — email address
- `phone_number` — phone number
- `id` — Meta's leadgen_id

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `403` on webhook verification | `VERIFY_TOKEN` mismatch | Ensure `.env` token matches Meta dashboard |
| `OAuthException 190` | Page Access Token expired | Generate new token from Graph API Explorer |
| No leads on screen | Socket not connected | Check ngrok URL in `frontend/config.js` |
| Duplicate leads | `seenLeadIds` not persisting | Restart server clears in-memory set |
| `ngrok` not found | Dev dependency not installed | Run `npm install` in root |

## Notes

- Page Access Token expires every 1-2 hours (OAuthException 190). Refresh from Graph API Explorer if testing after expiry.
- Poller runs every 5s as fallback for sandbox RTU throttling.
- No persistent database — in-memory only for PoC.