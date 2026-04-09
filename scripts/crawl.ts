import { config } from "dotenv";
config({ path: ".env.local" });

import { runCrawler } from "../lib/crawler/index";

runCrawler().catch((err) => {
  console.error("Crawler failed:", err);
  process.exit(1);
});
