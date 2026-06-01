const fs = require("fs");
const path = require("path");
const { run } = require("react-snap");

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

async function main() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const options = packageJson.reactSnap || {};
  const browserPath = resolveBrowserPath();

  await run({
    ...options,
    ...(browserPath ? { puppeteerExecutablePath: browserPath } : {}),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
