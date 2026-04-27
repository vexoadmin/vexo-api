import { resolveMetadata } from "../routes/metadata.js";

async function main() {
  const inputUrl = process.argv[2];
  if (!inputUrl) {
    console.error('Usage: pnpm metadata:test "<url>"');
    process.exit(1);
  }

  const logger = {
    info: (obj: Record<string, unknown>, msg?: string) => {
      console.log(`[metadata:test] ${msg || "log"}`, JSON.stringify(obj, null, 2));
    },
    error: (obj: Record<string, unknown>, msg?: string) => {
      console.error(`[metadata:test] ${msg || "error"}`, JSON.stringify(obj, null, 2));
    },
  };

  const result = await resolveMetadata(inputUrl, logger);
  console.log("[metadata:test] RESULT", JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("[metadata:test] FATAL", error);
  process.exit(1);
});
