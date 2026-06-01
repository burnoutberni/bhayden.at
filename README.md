# bhayden.at

Personal site built with React, TypeScript, and Vite.

The build includes static pre-rendering for main routes, producing HTML files per route in `dist/`.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

This creates a production build in `dist/`.

## Deploy

Deploy the contents of `dist/` to any static hosting provider (for example: Netlify, Vercel static output, Cloudflare Pages, or GitHub Pages).

This repository deploys from GitHub Actions on push to `main`:

1. CI runs `npm ci` and `npm run build` (including static pre-rendering).
2. CI uploads the generated `dist/` files to the remote path in `DEPLOY_DIST_PATH` over SSH.

Required GitHub secrets for deploy:

- `SSH_HOST`
- `SSH_USER`
- `SSH_KEY`
- `SSH_PORT` (optional; defaults to `22`)
- `DEPLOY_DIST_PATH` (for example `/var/www/bhayden.at/dist`)

If you want newsletter signup and Plausible analytics to work in production, define the optional environment variables from `.env.example` in your deployment environment.

Manual flow:

1. Run `npm ci`.
2. Run `npm run build`.
3. Publish `dist/`.

## Caddy

Example `Caddyfile` for serving this site as static pre-rendered pages:

```caddy
bhayden.at, www.bhayden.at {
	encode zstd gzip

	root * /var/www/bhayden.at/dist
	file_server

	header {
		X-Content-Type-Options nosniff
		X-Frame-Options SAMEORIGIN
		Referrer-Policy strict-origin-when-cross-origin
	}
}
```

After each deploy, copy your new `dist/` build to `/var/www/bhayden.at/dist` and reload Caddy.
