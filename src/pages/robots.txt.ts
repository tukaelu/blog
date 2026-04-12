export async function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: https://nsymtks.com/sitemap-index.xml`,
    { headers: { 'Content-Type': 'text/plain' } }
  )
}
