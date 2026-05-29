# bhayden.at

Personal site built with React, TypeScript, and Vite.

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

Typical flow:

1. Run `npm ci`.
2. Run `npm run build`.
3. Publish `dist/`.

## Caddy

Example `Caddyfile` for serving this site as a single-page app:

```caddy
bhayden.at, www.bhayden.at {
	encode zstd gzip

	root * /var/www/bhayden.at/dist
	try_files {path} /index.html
	file_server

	header {
		X-Content-Type-Options nosniff
		X-Frame-Options SAMEORIGIN
		Referrer-Policy strict-origin-when-cross-origin
	}
}
```

After each deploy, copy your new `dist/` build to `/var/www/bhayden.at/dist` and reload Caddy.
