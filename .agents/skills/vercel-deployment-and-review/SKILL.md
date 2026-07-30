---
name: vercel-deployment-and-review
description: Vercel deployment best practices, vercel.json SPA rewrites, header security, and build optimization for Vite/React applications.
---

# Vercel Deployment & Review Protocol

This skill provides a systematic protocol for auditing and optimizing Vite + React web applications for deployment to Vercel.

## 1. Core Vercel Requirements

### A. SPA Rewrites & Routing (`vercel.json`)
For Single Page Applications (React Router or stateful tab navigation), create a `vercel.json` file in the project root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### B. Build Output & Package Verification
- Ensure `package.json` contains valid `build` scripts: `"build": "tsc -b && vite build"`.
- Ensure output directory is `dist`.
- Verify clean compilation with `npx tsc --noEmit && npm run build`.

### C. Zero Dead Weight & Asset Optimization
- Verify all imported assets and dynamic chunks are present in `dist/assets`.
- Ensure SVG and HTML metadata tags (title, favicon, description) are populated for SEO and social sharing preview cards.

## 2. Review Checklist
1. `vercel.json` present with valid rewrites and security headers.
2. `index.html` title, meta description, and SEO tags configured.
3. `npm run build` succeeds with zero errors.
