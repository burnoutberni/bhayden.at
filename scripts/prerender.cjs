const fs = require("fs");
const path = require("path");
const http = require("http");
const handler = require("serve-handler");
const puppeteer = require("puppeteer");

function resolveBrowserPath() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function parseSlugFromNoteFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^slug:\s*(.+)$/m);
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

function collectNoteRoutes() {
  const notesDir = path.join(process.cwd(), "src", "content", "notes");
  if (!fs.existsSync(notesDir)) return [];

  const entries = fs.readdirSync(notesDir, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".md") && !entry.name.endsWith(".mdx")) continue;
    const slug = parseSlugFromNoteFile(path.join(notesDir, entry.name));
    if (slug) routes.push(`/notes/${slug}`);
  }

  return routes;
}

async function main() {
  const prerenderConfigPath = path.join(process.cwd(), "prerender.config.json");
  const options = fs.existsSync(prerenderConfigPath)
    ? JSON.parse(fs.readFileSync(prerenderConfigPath, "utf8"))
    : {};
  const sourceDir = path.resolve(process.cwd(), options.source || "dist");
  const configuredRoutes = options.include || ["/"];
  const autoRoutes = ["/404.html", ...collectNoteRoutes()];
  const routes = Array.from(new Set([...configuredRoutes, ...autoRoutes]));
  const waitFor = Number.isFinite(options.waitFor) ? options.waitFor : 0;
  const skipThirdPartyRequests = Boolean(options.skipThirdPartyRequests);
  const browserPath = resolveBrowserPath();
  const isCiLinux = process.platform === "linux" && process.env.CI;
  const defaultPuppeteerArgs = isCiLinux
    ? ["--no-sandbox", "--disable-setuid-sandbox"]
    : [];
  const puppeteerArgs = [
    ...(options.puppeteerArgs || []),
    ...defaultPuppeteerArgs.filter((arg) => !(options.puppeteerArgs || []).includes(arg)),
  ];

  const server = http.createServer((request, response) =>
    handler(request, response, {
      public: sourceDir,
      rewrites: [{ source: "**", destination: "/index.html" }],
    })
  );

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  const browser = await puppeteer.launch({
    headless: true,
    args: puppeteerArgs,
    ...(browserPath ? { executablePath: browserPath } : {}),
  });

  try {
    for (const route of routes) {
      const page = await browser.newPage();

      if (skipThirdPartyRequests) {
        await page.setRequestInterception(true);
        const baseOrigin = `http://127.0.0.1:${port}`;
        page.on("request", (request) => {
          const url = request.url();
          if (url.startsWith(baseOrigin) || url.startsWith("data:")) {
            request.continue();
            return;
          }
          request.abort();
        });
      }

      const routePath = route.startsWith("/") ? route : `/${route}`;
      const targetUrl = `http://127.0.0.1:${port}${routePath}`;
      await page.goto(targetUrl, { waitUntil: "networkidle0" });

      if (waitFor > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitFor));
      }

      const html = await page.content();
      const outputPath =
        routePath === "/"
          ? path.join(sourceDir, "index.html")
          : routePath.endsWith(".html")
            ? path.join(sourceDir, routePath.replace(/^\//, ""))
            : path.join(sourceDir, routePath.replace(/^\//, ""), "index.html");

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory()) {
        fs.rmSync(outputPath, { recursive: true, force: true });
      }

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, html, "utf8");
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
