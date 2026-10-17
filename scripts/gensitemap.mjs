import { register } from "node:module";
import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import { writeFileSync } from "fs";
import {
  SITEMAP_HOSTNAME,
  buildSitemapLinks,
} from "./sitemapLinks.mjs";

register("./gameslib-node-resolve.mjs", import.meta.url);

const { gameinfo } = await import("@abstractplay/gameslib");

// Do not add /feedback/* or /wishlist routes — feedback boards are noindex.

function listSitemapMetas() {
  const isProd = process.env.VITE_REAL_MODE === "production";
  return [...gameinfo.keys()].filter((id) => {
    if (!isProd) {
      return true;
    }
    const flags = gameinfo.get(id)?.flags ?? [];
    return !flags.includes("experimental");
  });
}

const links = buildSitemapLinks(listSitemapMetas());

const stream = new SitemapStream({
  hostname: SITEMAP_HOSTNAME,
});

await streamToPromise(Readable.from(links).pipe(stream)).then((data) => {
  writeFileSync("public/sitemap.xml", data.toString());
  console.log(`Sitemap generated (${links.length} URLs)`);
});
