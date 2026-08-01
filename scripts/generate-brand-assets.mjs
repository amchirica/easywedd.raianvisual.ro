/**
 * Generate brand assets from the uploaded Raian Fine Arts mark (JPEG → transparent PNG + ICO).
 * Run: node scripts/generate-brand-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const assetsDir = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-Andrei-Chirica-siteuri-bune-easywedd-raianvisual-ro/assets",
);

const candidates = fs
  .readdirSync(assetsDir)
  .filter((f) => f.includes("favicon_raianvisual"))
  .map((f) => path.join(assetsDir, f));

if (!candidates.length) {
  console.error("No source favicon found in assets");
  process.exit(1);
}

const source = candidates[0];
const appDir = path.join(root, "app");
const publicBrand = path.join(root, "public", "brand");
fs.mkdirSync(publicBrand, { recursive: true });

async function toTransparentPng(input, size, outPath) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = Buffer.from(data);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    // Near-white → transparent
    if (r > 240 && g > 240 && b > 240) {
      px[i + 3] = 0;
    } else if (r > 220 && g > 220 && b > 220) {
      // Soft edge
      const whiteness = (r + g + b) / 3;
      px[i + 3] = Math.max(0, Math.min(255, Math.round((255 - whiteness) * 8)));
    }
  }

  await sharp(px, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outPath);
}

const iconPath = path.join(appDir, "icon.png");
const applePath = path.join(appDir, "apple-icon.png");
const mark512 = path.join(publicBrand, "raian-mark.png");
const mark32 = path.join(publicBrand, "raian-mark-32.png");
const mark64 = path.join(publicBrand, "raian-mark-64.png");
const faviconPath = path.join(appDir, "favicon.ico");

await toTransparentPng(source, 512, mark512);
await toTransparentPng(source, 32, mark32);
await toTransparentPng(source, 64, mark64);
await toTransparentPng(source, 512, iconPath);
await toTransparentPng(source, 180, applePath);

const ico = await pngToIco([mark32, mark64]);
fs.writeFileSync(faviconPath, ico);

// Also copy into public for emails / absolute URLs
fs.copyFileSync(faviconPath, path.join(root, "public", "favicon.ico"));
fs.copyFileSync(iconPath, path.join(publicBrand, "icon.png"));

console.log("Generated:");
console.log(" -", faviconPath);
console.log(" -", iconPath);
console.log(" -", applePath);
console.log(" -", mark512);
