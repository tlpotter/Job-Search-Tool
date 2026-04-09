import { config } from "dotenv";
config({ path: ".env.local" });
import { dribbbleSource } from "../lib/crawler/sources/dribbble";
import { searchConfig } from "../lib/config";

dribbbleSource.fetch(searchConfig).then(jobs => {
  console.log("Dribbble listings:", jobs.length);
  jobs.slice(0, 5).forEach(j => console.log(" -", j.title, "@", j.company, "|", j.location));
}).catch(e => console.error(e));
