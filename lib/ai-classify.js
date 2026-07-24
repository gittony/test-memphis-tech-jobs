// Sends a single ambiguous posting to Claude Haiku 4.5 for a structured
// verdict. Only called for postings that rules genuinely can't resolve —
// see scripts/enrich-uncertain.js for what qualifies.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5";
const HAIKU_PRICE_PER_MTOK = { input: 1.0, output: 5.0 };

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    locationVerdict: { type: "string", enum: ["pass", "fail", "uncertain"] },
    confidence: { type: "number" },
    reason: { type: "string" },
    roleTags: { type: "array", items: { type: "string" } },
    seniority: {
      type: "string",
      enum: ["intern", "entry", "mid", "senior", "staff", "manager", "director", "unknown"],
    },
  },
  required: ["locationVerdict", "confidence", "reason", "roleTags", "seniority"],
  additionalProperties: false,
};

const SYSTEM_PROMPT =
  "You help a job board for Greater Memphis, Tennessee decide whether a software/data job posting " +
  "is genuinely based in that area, and tag its role and seniority. Greater Memphis means the posting " +
  "is located in Memphis, Germantown, Collierville, Bartlett, Cordova, Millington, Arlington, or Lakeland, " +
  "Tennessee — not just a company headquartered there, and not a fully remote role with no tie to the area. " +
  "If the posting could be located in Memphis but the available information genuinely doesn't say either way, " +
  "answer uncertain rather than guessing.";

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
          `Location field from the careers site: ${job.location}\n` +
          `Additional context: ${job.aiContext ?? "none"}`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: RESPONSE_SCHEMA } },
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const result = JSON.parse(textBlock.text);

  return { result, usage: response.usage, costUsd: estimateCost(response.usage) };
}
