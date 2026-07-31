import sharp from "sharp";
import webpush from "web-push";
import { writeFileSync, existsSync, statSync, mkdirSync } from "fs";
import { randomBytes } from "crypto";

mkdirSync("public/icons", { recursive: true });

const src = "public/icons/shield-source.jpg";
const hasSource = existsSync(src) && statSync(src).size > 500;

if (hasSource) {
  const pipe = (size, out) =>
    sharp(src)
      .resize(size, size, {
        fit: "contain",
        background: { r: 250, g: 250, b: 248, alpha: 1 },
      })
      .png()
      .toFile(out);

  await pipe(192, "public/icons/icon-192.png");
  await pipe(512, "public/icons/icon-512.png");
  await pipe(180, "public/icons/apple-touch-icon.png");
  console.log("Generated icons from downloaded shield");
} else {
  const svg = (size) =>
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="100%" height="100%" fill="#FAFAF8"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.42}" fill="#0B6E3D"/>
        <text x="50%" y="54%" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size * 0.28}" font-weight="700" fill="#FFFFFF">U</text>
      </svg>`
    );
  await sharp(svg(192)).png().toFile("public/icons/icon-192.png");
  await sharp(svg(512)).png().toFile("public/icons/icon-512.png");
  await sharp(svg(180)).png().toFile("public/icons/apple-touch-icon.png");
  console.log("Generated fallback shield icons");
}

const keys = webpush.generateVAPIDKeys();
const webhookSecret = randomBytes(32).toString("base64url");

writeFileSync(
  ".env.push.local",
  [
    `VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`,
    `VAPID_PRIVATE_KEY=${keys.privateKey}`,
    `VAPID_SUBJECT=mailto:admin@usmanian.app`,
    `PUSH_WEBHOOK_SECRET=${webhookSecret}`,
    "",
  ].join("\n")
);

console.log("---VAPID_PUBLIC---");
console.log(keys.publicKey);
console.log("---VAPID_PRIVATE---");
console.log(keys.privateKey);
console.log("---PUSH_WEBHOOK_SECRET---");
console.log(webhookSecret);
