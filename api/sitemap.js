const SITE = "https://usmanians-facebook.vercel.app";
const LASTMOD = "2026-10-10";
const urls = ["/", "/login", "/signup"];

export default function handler(req, res) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${SITE}${path}</loc>
    <lastmod>${LASTMOD}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  res.writeHead(200, {
    "Content-Type": "text/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
  });
  res.end(body);
}
