# PDFirst — Static Web Deployment Guide

**Document Version:** 1.0.0  
**Target Audience:** Students, Instructors, and Open-Source Contributors  
**Application Type:** Single Page Application (SPA) / Progressive Web App (PWA)  
**Output Directory:** `dist/`  
**Build Command:** `npm run build`  

---

## 1. Build Output Confirmation

PDFirst is bundled using Vite and TypeScript into a completely static, client-side distribution:

* **Production Directory:** `dist/`
* **Core Bundled Artifacts:**
  * `dist/index.html` — Application entry point, containing responsive meta tags, PWA manifest links, and pre-connected Google Fonts.
  * `dist/assets/*.js` — Minified ECMAScript modules (React 18, Tiptap/ProseMirror, jsPDF, pdfjs-dist, DOMPurify).
  * `dist/assets/*.css` — Design system stylesheets with HSL CSS variables for light and dark themes.
  * `dist/manifest.json` — PWA Web App Manifest (Name: *"PDF-First Editor"*, Short Name: *"PDF Editor"*, Standalone display).
  * `dist/sw.js` — Service worker script implementing offline app shell caching (`pdfirst-cache-v1`).
  * `dist/icons/` — App icons (`icon.svg`, `icon-192.png`, `icon-512.png`).
  * `dist/_redirects` — Universal SPA routing fallback for Netlify and Cloudflare Pages.
* **Server Dependency:** **Zero.** No Node.js backend, Python runtime, or database server is required to host or run the application.

---

## 2. Recommended Deployment Targets

For a student project, we recommend hosts that offer **free tier hosting**, **automatic SSL (HTTPS)**, **zero complex configuration**, and **instant deployment**:

| Host | Best For | Free Tier | Deploy Method | Rating |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel** *(Recommended #1)* | Best all-around for Vite projects | Unlimited personal projects, automatic HTTPS | Git push or `vercel` CLI | ⭐⭐⭐⭐⭐ (Top Choice) |
| **Netlify** *(Recommended #2)* | Easiest manual deploy (no Git required) | 100 GB bandwidth / month | Drag-and-drop `dist/` folder or Git | ⭐⭐⭐⭐⭐ (Easiest) |
| **Cloudflare Pages** | Fastest global CDN | Unlimited bandwidth | Git push or `wrangler` CLI | ⭐⭐⭐⭐ |
| **GitHub Pages** | Hosting alongside source code | Free on public repos | GitHub Actions or `gh-pages` | ⭐⭐⭐ |

### Why Vercel is the Primary Recommendation:
1. **Zero-Configuration Vite Support:** Vercel automatically detects Vite, sets the build command to `npm run build`, and sets the output directory to `dist`.
2. **Pre-Configured SPA Routing:** The repository includes a pre-configured [`vercel.json`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/vercel.json) that rewrites all incoming routes (e.g. `/health`, `/status`) to `/index.html`.
3. **PWA & HTTPS:** PWA service workers require a secure HTTPS origin. Vercel provisions free, automatic Let's Encrypt SSL certificates for all `*.vercel.app` domains instantly.
4. **Pull Request Previews:** If working in a student team, every Git pull request automatically generates a live preview URL.

### Why Netlify is the Best Zero-Git Alternative:
If you do not want to set up Git or CLI tools right away, **Netlify Drop** allows you to literally drag and drop the `dist/` folder into your browser at [app.netlify.com/drop](https://app.netlify.com/drop) and have a live, working URL in 30 seconds.

---

## 3. Platform Configuration & Routing

### 3.1 Host Build Settings
When connecting your Git repository to any static host, use these exact settings:

* **Framework Preset:** `Vite`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Install Command:** `npm install`
* **Node Version:** `18.x` or `20.x` (LTS)

### 3.2 Environment Variables
* **Core Application:** **None required.** The editor, local autosave, IndexedDB storage, PDF export, and text-based PDF import execute 100% client-side in the browser.
* **Optional Cloud Sync (Future/Optional):** Only if you later choose to connect live cloud backend APIs (as defined in `.env.example`):
  * `VITE_SYNC_API_BASE_URL` (e.g., `https://api.pdfirst.com/v1`)
  * `VITE_AUTH_DOMAIN`
  * `VITE_AUTH_CLIENT_ID`

### 3.3 Client-Side Routing & SPA Fallbacks
PDFirst handles navigation via internal state and includes dedicated health-check routes at `/health` and `/status` (or `#/health` and `#/status`).

To ensure that opening `https://your-app.vercel.app/health` directly does not trigger a host `404 Not Found` error, the project includes:

1. **For Vercel ([`vercel.json`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/vercel.json)):**
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
2. **For Netlify & Cloudflare Pages ([`public/_redirects`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/public/_redirects)):**
   ```
   /*    /index.html   200
   ```
   *(This file is automatically copied to `dist/_redirects` during `npm run build`.)*
3. **Hash Route Guarantee:**
   `https://your-domain.com/#/health` works out of the box on **all** web servers without any server rewrite configuration.

---

## 4. Step-by-Step Deployment Instructions

### Option A: Deploy to Vercel via Git (Recommended)

#### Step 1: Push Your Code to GitHub / GitLab / Bitbucket
Ensure your project is pushed to a remote repository:
```bash
git init
git add .
git commit -m "feat: complete PDFirst MVP ready for deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/pdfirst.git
git push -u origin main
```

#### Step 2: Import into Vercel
1. Log in to [vercel.com](https://vercel.com/) (sign in with your GitHub account).
2. Click **"Add New..."** $\to$ **"Project"**.
3. Select your `pdfirst` repository and click **"Import"**.
4. Confirm Project Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **"Deploy"**.
6. In $\sim 45$ seconds, Vercel will provide your live URL: `https://pdfirst-<your-username>.vercel.app`.

---

### Option B: Deploy to Vercel via CLI (Fast Terminal Deploy)

1. Open your terminal in `PDFirst/`:
```bash
# Install Vercel CLI globally (one time)
npm install -g vercel

# Run production build locally to verify
npm run build

# Deploy directly to Vercel
vercel --prod
```
2. Follow the interactive prompts:
   - *Set up and deploy?* $\to$ `Y`
   - *Which scope?* $\to$ Select your account
   - *Link to existing project?* $\to$ `N`
   - *Project name?* $\to$ `pdfirst`
   - *Directory located?* $\to$ `./`
   - *Auto-detected Vite settings?* $\to$ `Y`
3. The CLI outputs your production URL in seconds.

---

### Option C: Deploy to Netlify (Drag-and-Drop — 30 Seconds)

1. Build the production assets locally:
```bash
npm run build
```
2. In your file explorer, locate the `dist/` directory inside `c:\Users\ritol\OneDrive\Desktop\PDFirst\dist`.
3. Open your browser and navigate to [app.netlify.com/drop](https://app.netlify.com/drop).
4. Drag and drop the `dist/` folder directly into the browser dropzone.
5. Netlify instantly deploys your app and gives you a free live URL (e.g., `https://creative-app-12345.netlify.app`).

---

### Option D: Deploy to GitHub Pages (Alternative)

If your institution requires deployment via GitHub Pages:

1. Install the `gh-pages` helper utility:
```bash
npm install --save-dev gh-pages
```
2. In `package.json`, add deploy scripts:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```
3. If deploying to a project page (e.g., `https://<username>.github.io/pdfirst/`), update `vite.config.ts`:
```typescript
export default defineConfig({
  base: './', // Use relative asset paths for subfolder hosting
  plugins: [react()],
  // ...
});
```
4. Run:
```bash
npm run deploy
```
5. In GitHub repository settings $\to$ **Pages**, set branch to `gh-pages` and root folder `/`.

---

## 5. Post-Deployment Verification Checklist

Once your live URL is generated, execute this quick 3-minute validation protocol to confirm complete system integrity:

### 1. Initial Page Load & Console Health
- [ ] Open your live URL (e.g., `https://pdfirst.vercel.app/`) in Google Chrome or Edge.
- [ ] Verify the application shell, header, formatting toolbar, and sample document load smoothly.
- [ ] Press `F12` to open Developer Tools $\to$ **Console**. Confirm there are **zero JavaScript errors**.

### 2. Health-Check Route Verification
- [ ] Navigate directly to `https://your-domain/health`.
- [ ] Confirm the page renders the clean Health Check screen:
  - Status: **"Status: OK"**
  - Version: **"Version: 1.0.0"**
  - Environment: **"Environment: production"**
- [ ] Also verify `https://your-domain/#/status`.

### 3. Progressive Web App (PWA) & Offline Test
- [ ] In Chrome DevTools, open the **Application** tab $\to$ **Service Workers**.
- [ ] Confirm `sw.js` is **activated and running**.
- [ ] Look at the header bar: verify the blue **"Install App"** (`#btn-install-pwa`) button appears (or native address bar install icon).
- [ ] In DevTools $\to$ **Network**, check the **Offline** checkbox.
- [ ] Press `Ctrl+R` / `Cmd+R` to refresh the page while offline.
- [ ] **Pass Criteria:** The app shell and editor rehydrate immediately without an internet error screen.

### 4. Core Workflow Verification
- [ ] **Create & Edit:** Click the logo/dashboard icon $\to$ click **"New Document"**. Type a title: *"Final Project Report"*. Add an H1 heading, a paragraph, and a 2x3 table.
- [ ] **Autosave:** Observe the status indicator in the header bar transition: `Editing...` $\to$ `(✓) Saved [Time]`.
- [ ] **Persistence:** Reload the browser tab (`Ctrl+R`). Verify your document and all formatting remain intact (loaded from IndexedDB).
- [ ] **Vector PDF Export:** Click **"Export PDF"** $\to$ choose `A4` $\to$ click **"Generate PDF"**. Confirm a valid vector `.pdf` file downloads to your computer and opens in your PDF reader.
- [ ] **PDF Import:** Click **"Import PDF"** $\to$ upload a text-based PDF. Verify the text preview modal appears and imports editable content into the canvas.

---

## 6. Common Issues & Troubleshooting

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| **Blank screen on GitHub Pages** | Absolute asset paths `/assets/...` fail on subfolder domains. | Set `base: './'` in `vite.config.ts` and rebuild. |
| **404 Not Found when reloading `/health`** | Web server is trying to find a physical `/health` file. | Ensure `vercel.json` or `_redirects` is present in the deployment root. |
| **PWA Install button does not appear** | PWA requires HTTPS or localhost; or app is already installed. | Ensure domain is served over HTTPS; test in an Incognito window. |
| **Large bundle warning during build** | `pdfjs-dist` includes pre-built PDF parsing engines. | Expected for PDF parsers. Does not affect runtime performance. |

---

*The application is fully prepared for static deployment. Choose your preferred host above and proceed with deployment.*
