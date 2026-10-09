# Deploying ATLAS to Cloudflare Pages

This project is fully configured for zero-friction deployment to **Cloudflare Pages** using standard **npm**.

---

## 🚀 1-Minute Cloudflare Pages Deployment

### Step 1: Push Repository to GitHub
Ensure you push your repository with the generated `package-lock.json` and standard `package.json`.

```bash
git add .
git commit -m "feat: configure ATLAS for Cloudflare Pages deployment"
git push origin main
```

---

### Step 2: Connect to Cloudflare Pages
1. Log in to your **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2. Navigate to **Workers & Pages** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**.
3. Select your repository and branch (`main`).

---

### Step 3: Build & Deployment Settings
Fill in the following build configuration:

| Setting | Value |
| :--- | :--- |
| **Framework preset** | `Vite` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (leave blank or `/`) |

> 💡 **Notice**: Bun has been completely removed. Cloudflare Pages automatically detects standard **`npm`** and executes `npm install` and `npm run build` out of the box.

---

### Step 4: Environment Variables (Optional)
In Cloudflare Pages **Settings** ➔ **Environment variables**, you may optionally define:

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | *(Optional)* Default Google AI Studio API Key. Supports both latest `AQ.Ab...` and classic `AIzaSy...` formats. |
| `NODE_VERSION` | `20` or `22` (Recommended) |

*(Users can also enter and manage their own Google AI Studio API key directly inside the app's Settings UI or inline banners, saved securely in local browser storage).*

---

### Step 5: Click "Save and Deploy"
Cloudflare will run `npm install` and `npm run build`. Within ~45 seconds, your ATLAS platform will be live at:
`https://<your-project>.pages.dev`

---

## ✨ Features Verified for Cloudflare
- **Standard npm package-lock**: No Bun lockfiles or binary dependencies.
- **Infinite Memory System**: Persistent multi-session memory stored locally and injected into multi-turn LLM reasoning across browser sessions.
- **Dual Direct & Server Routing**: Cloudflare Pages serves the static Vite bundle directly, communicating with Google AI Studio seamlessly.
- **SPA Fallback Configured**: `_redirects` rule ensures client-side routing never produces 404s on page refresh.
