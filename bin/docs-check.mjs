/* eslint-env node */
/**
 * Validate front/docs only: nav.json and internal /front/ doc links.
 *
 * Cross-repo links (/backend/, /crons/, /gameslib/, etc.) are not checked here.
 * The AbstractPlay/docs repo runs the full multi-vendor check before publish.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONT_ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(FRONT_ROOT, "docs");
const REPO_PREFIX = "front";
const WARN_ONLY = process.env.DOCS_CHECK_WARN === "1";

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function relPathToSlug(relPath) {
  return relPath
    .replace(/\\/g, "/")
    .replace(/\.md$/, "")
    .replace(/\/index$/, "")
    .replace(/^index$/, "index");
}

function slugToUrl(slug) {
  return slug === "index" ? `/${REPO_PREFIX}/` : `/${REPO_PREFIX}/${slug}/`;
}

function defaultTitle(slug) {
  if (slug === "index") return "Overview";
  const leaf = slug.split("/").pop();
  return leaf.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function titleFromMarkdown(content) {
  const body = content.startsWith("---")
    ? content.replace(/^---[\s\S]*?---\n*/, "")
    : content;
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function collectDocSlugs(docsRoot) {
  const slugs = new Map();

  function walk(dir, base = "") {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = path.join(base, entry.name).replace(/\\/g, "/");
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, rel);
      } else if (entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
        const slug = relPathToSlug(rel);
        const content = fs.readFileSync(full, "utf8");
        slugs.set(slug, { filePath: full, title: titleFromMarkdown(content) });
      }
    }
  }

  walk(docsRoot);
  return slugs;
}

function collectDocPages(docsRoot) {
  const pages = new Map();
  for (const [slug, meta] of collectDocSlugs(docsRoot)) {
    pages.set(slugToUrl(slug), meta.filePath);
  }
  return pages;
}

function loadNavOrder(docsRoot) {
  const navPath = path.join(docsRoot, "nav.json");
  if (!fs.existsSync(navPath)) {
    return { order: [], source: null };
  }
  return {
    order: JSON.parse(fs.readFileSync(navPath, "utf8")),
    source: navPath,
  };
}

function normalizeNavItem(item) {
  if (typeof item === "string") return { slug: item, title: null };
  return { slug: item.slug, title: item.title || null };
}

function validateNavConfig(orderConfig, discoveredSlugs) {
  const listedSlugs = new Set();

  for (const raw of orderConfig) {
    const { slug } = normalizeNavItem(raw);
    if (!slug) {
      fail("Nav entry missing slug in docs/nav.json");
      continue;
    }
    const url = slugToUrl(slug);
    if (listedSlugs.has(slug)) {
      fail(`Duplicate nav entry ${url} in docs/nav.json`);
    }
    listedSlugs.add(slug);
    if (!discoveredSlugs.has(slug)) {
      fail(`Nav entry ${url} in docs/nav.json has no matching doc page`);
    }
  }

  for (const slug of discoveredSlugs.keys()) {
    if (!listedSlugs.has(slug)) {
      const url = slugToUrl(slug);
      const title = discoveredSlugs.get(slug).title || defaultTitle(slug);
      warn(
        `Doc page ${url} ("${title}") is not in docs/nav.json — it will appear at the end of the nav; add its slug to set order`
      );
    }
  }
}

function resolveDocLink(pageUrl, href) {
  const pathPart = href.split("#")[0];
  if (!pathPart || pathPart.startsWith("http") || pathPart.startsWith("mailto:")) {
    return null;
  }
  if (pathPart.startsWith("/")) return pathPart;
  const base = pageUrl.endsWith("/") ? pageUrl : `${pageUrl}/`;
  return new URL(pathPart, `http://local${base}`).pathname;
}

function isPublishedDocTarget(pathOnly, pageUrls) {
  if (pageUrls.has(pathOnly)) return true;
  if (!pathOnly.endsWith("/") && pageUrls.has(`${pathOnly}/`)) return true;
  return false;
}

function shouldSkipLinkCheck(resolved) {
  if (/\.(ts|tsx|js|jsx|mjs|cjs|yml|yaml|json|css|scss)$/i.test(resolved)) {
    return true;
  }
  if (!resolved.startsWith(`/${REPO_PREFIX}/`)) {
    return true;
  }
  if (
    /^\/front\/(.*\/)?(src|public|config|\.github)\//.test(resolved)
  ) {
    return true;
  }
  return false;
}

function checkFrontDocLinks() {
  if (!fs.existsSync(DOCS_ROOT)) {
    fail("docs/ directory missing");
    return;
  }

  const discovered = collectDocSlugs(DOCS_ROOT);
  const pageUrls = new Set(collectDocPages(DOCS_ROOT).keys());
  const { order } = loadNavOrder(DOCS_ROOT);
  validateNavConfig(order, discovered);

  const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;

  for (const [pageUrl, filePath] of collectDocPages(DOCS_ROOT)) {
    const content = fs.readFileSync(filePath, "utf8");
    let match;
    while ((match = linkRe.exec(content)) !== null) {
      const href = match[2].trim();
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("{%") ||
        /^https?:/.test(href) ||
        href.startsWith("mailto:")
      ) {
        continue;
      }

      const resolved = resolveDocLink(pageUrl, href);
      if (!resolved || shouldSkipLinkCheck(resolved)) {
        continue;
      }

      if (!isPublishedDocTarget(resolved, pageUrls)) {
        const relFile = path.relative(FRONT_ROOT, filePath).replace(/\\/g, "/");
        fail(
          `Broken doc link in ${relFile}: […](${href}) resolves to ${resolved} (page is ${pageUrl})`
        );
      }
    }
  }
}

checkFrontDocLinks();

for (const w of warnings) console.warn("WARN:", w);
for (const e of errors) console.error("ERROR:", e);

if (errors.length > 0 && !WARN_ONLY) {
  console.error(`\ndocs:check failed with ${errors.length} error(s)`);
  process.exit(1);
}

console.log(`docs:check passed (${warnings.length} warning(s))`);
