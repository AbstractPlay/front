import { writeFileSync, readFileSync } from "fs";

// load exported JSON file
const data = JSON.parse(readFileSync("c:/users/aaron/desktop/announcements.json"));
const news = [];
for (const rec of data.messages) {
    if (rec.content === "") {
        continue;
    }
    const time = new Date(rec.timestamp).getTime();
    news.push({time, text: rec.content});
}
writeFileSync("public/data/news.json", JSON.stringify(news));
console.log("done");