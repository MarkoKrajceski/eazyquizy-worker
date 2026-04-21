# EazyQuizy Worker

Cloudflare Worker backend for [EazyQuizy](https://github.com/MarkoKrajceski/eazyquizy-clean). Receives quiz generation requests from the app and calls the Anthropic API server-side, keeping the API key out of the mobile bundle.

## Endpoint

```
POST /generate
```

**Body:**
```json
{
  "topic": "World War II",
  "language": "English",
  "promptType": "true/false",
  "mode": "scored"
}
```

**Response:** JSON array of `{ question, answer }` objects.

## Deploy

```bash
npm install -g wrangler
wrangler login
wrangler deploy
wrangler secret put ANTHROPIC_API_KEY
```

## Development

```bash
wrangler dev
```
