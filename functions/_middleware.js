// Cloudflare gives every Pages project a free *.pages.dev URL alongside the
// custom domain, and it stays live and crawlable by default. Google found
// both this and tempanywebstudios.co.uk serving identical content and
// flagged it as "Duplicate without user-selected canonical" in Search
// Console — a rel=canonical tag alone is a hint Google can choose to ignore,
// not a directive. A hard redirect removes the duplicate outright instead of
// hoping Google trusts the hint.
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname.endsWith('.pages.dev')) {
    url.protocol = 'https:';
    url.hostname = 'tempanywebstudios.co.uk';
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
