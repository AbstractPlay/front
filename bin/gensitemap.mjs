import { gameinfo } from "@abstractplay/gameslib";
import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import { writeFileSync } from "fs";

// An array with your links
const links = [
    { url: "/about",  changefreq: "yearly", priority: 0.5  },
    { url: "/legal",  changefreq: "yearly", priority: 0.5  },
    { url: "/news",  changefreq: "monthly", priority: 0.5  },
    { url: "/stats",  changefreq: "weekly", priority: 0.5  },
    { url: "/games",  changefreq: "monthly", priority: 0.5  },
    { url: "/players",  changefreq: "weekly", priority: 0.5  },
]

// add /challenges links
// add /listgames links
// add /ratings links
for (const meta of gameinfo.keys()) {
    links.push({ url: `/challenges/${meta}`,  changefreq: "weekly", priority: 0.5  });
    links.push({ url: `/listgames/current/${meta}`,  changefreq: "weekly", priority: 0.5  });
    links.push({ url: `/listgames/completed/${meta}`,  changefreq: "weekly", priority: 0.5  });
    links.push({ url: `/ratings/${meta}`,  changefreq: "weekly", priority: 0.5  });
}


// Create a stream to write to
const stream = new SitemapStream({
    hostname: "https://play.abstractplay.com/",
})

// Return a promise that resolves with your XML string
await streamToPromise(
    Readable.from(links).pipe(stream)
).then((data) => {
        writeFileSync("public/sitemap.xml", data.toString());
        console.log("Sitemap generated");
    }
)
