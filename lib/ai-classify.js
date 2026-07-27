// Sends a single ambiguous posting to Claude Haiku 4.5 for a structured
// verdict. Only called for postings that rules genuinely can't resolve —
// see scripts/enrich-uncertain.js for what qualifies.
//
// Slice 11 added roleVerdict alongside the original locationVerdict: some
// postings reach here because the *title* is ambiguous (e.g. "Digital
// Innovation Engineer" — plausibly tech, doesn't match the strict
// whitelist), not just because the location is. build-listings.js only
// trusts whichever verdict corresponds to what was actually uncertain —
// a title the rules already confirmed stays confirmed regardless of what
// the AI says about it here, and likewise for location.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5";
const HAIKU_PRICE_PER_MTOK = { input: 1.0, output: 5.0 };

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    locationVerdict: { type: "string", enum: ["pass", "fail", "uncertain"] },
    roleVerdict: { type: "string", enum: ["pass", "fail", "uncertain"] },
    confidence: { type: "number" },
    reason: { type: "string" },
    roleTags: { type: "array", items: { type: "string" } },
    seniority: {
      type: "string",
      enum: ["intern", "entry", "mid", "senior", "staff", "manager", "director", "unknown"],
    },
  },
  required: ["locationVerdict", "roleVerdict", "confidence", "reason", "roleTags", "seniority"],
  additionalProperties: false,
};

const SYSTEM_PROMPT =
  "You help a job board for Greater Memphis, Tennessee decide whether a job posting is (1) a genuine " +
  "software/data/technology role, and (2) genuinely based in Greater Memphis, then tag its role and " +
  "seniority. Greater Memphis means the posting is located in Memphis, Germantown, Collierville, Bartlett, " +
  "Cordova, Millington, Arlington, or Lakeland, Tennessee — not just a company headquartered there, and not " +
  "a fully remote role with no tie to the area. For roleVerdict: pass only for genuine software engineering, " +
  "data engineering/science, IT development, cybersecurity, or similar technical roles — a title mentioning " +
  "'digital,' 'systems,' 'technical,' or 'innovation' isn't automatically a tech role (e.g. a plant's " +
  "'Process Safety Engineer' should fail), while a title like 'Digital Innovation Engineer' whose actual " +
  "duties are software/data work should pass. When a job description excerpt is provided, weigh its actual " +
  "listed duties and requirements (programming languages, degree requirements, technical skills, etc.) more " +
  "heavily than the title or department alone — a company's internal department label is a weak signal and " +
  "can be misleading (e.g. web/software development work sometimes sits under a 'Marketing' team responsible " +
  "for the company website, not under 'Digital' or 'Technology'). If the posting could plausibly qualify on " +
  "either dimension but the available information genuinely doesn't say either way, answer uncertain rather " +
  "than guessing.";

let client;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export function estimateCost(usage) {
  return (
    (usage.input_tokens / 1_000_000) * HAIKU_PRICE_PER_MTOK.input +
    (usage.output_tokens / 1_000_000) * HAIKU_PRICE_PER_MTOK.output
  );
}

export async function classifyUncertainJob(job) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content:
          `Job title: ${job.title}\n` +
          `Company: ${job.company}\n` +
          `Department/team: ${job.department ?? "none"}\n` +
          `Location field from the careers site: ${job.location}\n` +
          `Job description excerpt: ${job.descriptionExcerpt ?? "not available"}\n` +
          `Additional context: ${job.aiContext ?? "none"}`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: RESPONSE_SCHEMA } },
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const result = JSON.parse(textBlock.text);

  return { result, usage: response.usage, costUsd: estimateCost(response.usage) };
}
