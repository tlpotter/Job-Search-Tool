import { config } from "dotenv";
config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";

async function test() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log("API key loaded:", process.env.ANTHROPIC_API_KEY ? "yes (" + process.env.ANTHROPIC_API_KEY.slice(0, 8) + "...)" : "MISSING");

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      messages: [{ role: "user", content: "Reply with: API working!" }],
    });
    console.log("✓ Success:", (msg.content[0] as { text: string }).text);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    console.error("✗ Failed:", e.status, e.message);
  }
}

test();
