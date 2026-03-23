# GarudClassesApk

## Run As Website (Expo Web)

1. Install dependencies:

```bash
npm install
```

2. Create env file from example:

```bash
cp .env.example .env
```

3. Start web build:

```bash
npm run web
```

4. Open the URL shown in terminal (usually `http://localhost:8081`).

## Important For Login/Cookies On Web

- Your backend must allow CORS from your web origin.
- Backend must allow credentials (`Access-Control-Allow-Credentials: true`).
- Cookies should be set with browser-compatible flags (`SameSite` / `Secure`) based on your deployment.

## Deploy On Vercel

1. Push this project to GitHub.
2. In Vercel, click `Add New Project` and import this repo.
3. Keep defaults (the repo includes `vercel.json`):
	- Build Command: `npm run vercel-build`
	- Output Directory: `dist`
4. Add Environment Variable in Vercel project settings:
	- `EXPO_PUBLIC_API_BASE_URL=https://testportal.garudclasses.com/api`
5. Deploy.

For every new deployment, Vercel rebuilds Expo web and serves it as a static SPA.

