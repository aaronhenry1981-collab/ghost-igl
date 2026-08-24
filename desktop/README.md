# IGL Command — Desktop Companion

Windows companion app for active paid Recon 6 members. v0.1.0 ships the map/site reference and server-verified license activation tied to r6coaching.com. Live coaching lands in v0.2.

## Development

```bash
cd desktop
npm install
npm start      # launches Electron in dev mode
```

## Building the Windows installer

```bash
npm run build:win
```

Output: `desktop/dist/IGLCommand-Setup-0.1.0.exe`. To sign: set `CSC_LINK` / `CSC_KEY_PASSWORD` env vars pointing to a code-signing cert (~$200/yr from a CA — required to avoid SmartScreen warnings).

## License activation flow

1. Customer subscribes to Champion on r6coaching.com
2. They visit `/activate` → the server issues a signed, short-lived, product-scoped license token
3. They paste it into IGL Command → the app verifies it with r6coaching.com and stores it with Windows secure storage in `%APPDATA%/igl-command/license.enc`
4. The app re-verifies membership at launch and every 15 minutes; canceled or expired access locks immediately

Token payload shape (from `src/pages/ActivatePage.jsx`):
```
{ version: 2, iss, aud, product, user_id, email, plan, issued_at, expires_at }
```

## Shipping

- Host the installer where you want (S3 + CloudFront recommended — keeps "only AWS" rule)
- Set `VITE_DOWNLOAD_URL` in the website's `.env.production` to the installer URL
- The `/download` page auto-switches from the beta-email state to a Download button

## v0.2 roadmap

- Screen capture (PC display) + capture card (Elgato) input pipeline
- Vision model (Bedrock Claude) for game state recognition — map, side, operator, HUD state
- TTS callouts (Polly or a hosted voice)
- WebSocket connection to live coaching backend Lambda (new `/vod/live` route)
- Auto-updater (electron-updater against S3-hosted `latest.yml`)
