const SITE = "https://usmanians-facebook.vercel.app";
const LASTMOD = "2026-10-10";

const urls = ["/", "/login", "/signup"];

module.exports = (req, res) => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${SITE}${path === "/" ? "/" : path}</loc>
    <lastmod>${LASTMOD}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  res.setHeader("Content-Type", "text/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.statusCode = 200;
  res.end(body);
};
