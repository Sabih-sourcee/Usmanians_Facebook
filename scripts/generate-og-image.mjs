import sharp from "sharp";
import { existsSync, statSync, mkdirSync } from "fs";

mkdirSync("public/og", { recursive: true });

const src = "public/icons/shield-source.jpg";
const hasSource = existsSync(src) && statSync(src).size > 500;
const width = 1200;
const height = 630;

const plate = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#0B6E3D"/>
  <rect x="0" y="560" width="1200" height="70" fill="#D4A017"/>
  <text x="620" y="290" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="#FFFFFF">Usmanian</text>
  <text x="620" y="360" font-family="Arial,sans-serif" font-size="32" fill="#FAFAF8">Private network for UPSS students &amp; alumni</text>
  <text x="620" y="420" font-family="Arial,sans-serif" font-size="24" fill="#D4A017">CID-gated · Privacy first · Usman Public School System</text>
</svg>`);

if (hasSource) {
  const shield = await sharp(src)
    .resize(280, 280, {
      fit: "contain",
      background: { r: 250, g: 250, b: 248, alpha: 1 },
    })
    .png()
    .toBuffer();
  await sharp(plate)
    .composite([{ input: shield, left: 160, top: 160 }])
    .png()
    .toFile("public/og/og-default.png");
} else {
  await sharp(plate).png().toFile("public/og/og-default.png");
}

console.log("Generated public/og/og-default.png");
