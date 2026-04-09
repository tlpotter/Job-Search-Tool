import { Resend } from "resend";
import { JobListing } from "../crawler/types";
import { composeEmail } from "./compose";
import { searchConfig } from "../config";

export async function sendDigest(listings: JobListing[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Resend: missing RESEND_API_KEY, skipping email");
    return;
  }

  // Only email listings that were AI scored (score >= 60)
  const aiScoredListings = listings.filter((l) => l.aiFitScore != null);

  if (aiScoredListings.length === 0) {
    console.log("No AI-scored listings to email.");
    return;
  }

  const resend = new Resend(apiKey);
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const html = composeEmail(aiScoredListings);

  const { error } = await resend.emails.send({
    from: "Job Crawler <onboarding@resend.dev>",
    to: searchConfig.emailTo,
    subject: `📬 ${aiScoredListings.length} AI-scored UX jobs — ${today}`,
    html,
  });

  if (error) {
    throw new Error(`Resend email failed: ${JSON.stringify(error)}`);
  }

  console.log(`  Email sent to ${searchConfig.emailTo}`);
}
