/**
 * Global Communication Lmtd — static site worker.
 *
 * The site itself is plain HTML/CSS/JS served from the static asset binding,
 * so it needs no Node APIs and holds no server state: Workers-compatible.
 * The only logic here is a redirect map that keeps the site's original,
 * punctuation-heavy URLs working (those filenames cannot be uploaded as assets).
 */

const LEGACY_REDIRECTS = new Map([
  ["/services | global communications.html", "/services.html"],
  ["/partners | global communications.html", "/partners.html"],
  ["/signup : login | golbal communications.html", "/login.html"],
  ["/payment form.html", "/payment.html"],
  ["/our fields.html", "/services.html"],
]);

function normalisePath(pathname) {
  try {
    return decodeURIComponent(pathname).toLowerCase();
  } catch {
    return pathname.toLowerCase();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = LEGACY_REDIRECTS.get(normalisePath(url.pathname));

    if (target) {
      return Response.redirect(new URL(target, url).toString(), 308);
    }

    return env.ASSETS.fetch(request);
  },
};
