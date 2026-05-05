import { config } from "dotenv";
config({ path: ".env.local" });

import { sendDigest } from "../lib/email/send";

sendDigest()
  .then(() => console.log("Done"))
  .catch((e) => console.error("FAILED:", e.message));
