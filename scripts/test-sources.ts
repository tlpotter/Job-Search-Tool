import { config } from "dotenv";
config({ path: ".env.local" });

import { searchConfig } from "../lib/config";
import { remoteokSource } from "../lib/crawler/sources/remoteok";
import { weworkremotelySource } from "../lib/crawler/sources/weworkremotely";
import { greenhouseSource } from "../lib/crawler/sources/greenhouse";
import { leverSource } from "../lib/crawler/sources/lever";
import { dribbbleSource } from "../lib/crawler/sources/dribbble";
import { jobicySource } from "../lib/crawler/sources/jobicy";
import { remotiveSource } from "../lib/crawler/sources/remotive";
import { coroflotSource } from "../lib/crawler/sources/coroflot";
import { hnHiringSource } from "../lib/crawler/sources/hn-hiring";
import { ashbySource } from "../lib/crawler/sources/ashby";
import { indeedSource } from "../lib/crawler/sources/indeed";

async function test() {
  const sources = [
    dribbbleSource,
    remoteokSource,
    weworkremotelySource,
    greenhouseSource,
    leverSource,
    jobicySource,
    remotiveSource,
    coroflotSource,
    hnHiringSource,
    ashbySource,
    indeedSource,
  ];

  await Promise.all(sources.map(async (source) => {
    try {
      const listings = await source.fetch(searchConfig);
      console.log(`✓ ${source.name}: ${listings.length} listings`);
      listings.slice(0, 3).forEach(l => console.log(`    - ${l.title} @ ${l.company} | ${l.location}`));
    } catch (err) {
      console.error(`✗ ${source.name}:`, err instanceof Error ? err.message : err);
    }
  }));
}

test();
