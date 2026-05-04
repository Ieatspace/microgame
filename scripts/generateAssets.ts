import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type AssetRequest = {
  file: string;
  prompt: string;
};

const OUTPUT_DIR = join(process.cwd(), "public", "assets", "sprites");
const MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5";

const ASSETS: AssetRequest[] = [
  {
    file: "wizard.png",
    prompt:
      "16-bit pixel art sprite of a medieval wizard, purple robe, glowing staff, front-facing, transparent background, square game asset, clean dark outline, limited color palette, readable at small size"
  },
  {
    file: "knight.png",
    prompt:
      "16-bit pixel art sprite of a medieval knight, gray silver armor, red plume, sword and shield, front-facing, transparent background, square game asset, clean dark outline, limited color palette, readable at small size"
  },
  {
    file: "archer.png",
    prompt:
      "16-bit pixel art sprite of a medieval archer, green hood, wooden bow, front-facing, transparent background, square game asset, clean dark outline, limited color palette, readable at small size"
  },
  {
    file: "catapult.png",
    prompt:
      "16-bit pixel art sprite of a small wooden catapult with stone loaded, medieval fantasy tower defense asset, transparent background, square game asset, clean dark outline, limited color palette, readable at small size"
  },
  {
    file: "boss.png",
    prompt:
      "16-bit pixel art sprite of a giant medieval knight boss, heavy silver armor, purple plume, massive shield, transparent background, square game asset, clean dark outline, limited color palette, readable at small size"
  }
];

async function generateAsset(asset: AssetRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate optional image assets.");
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: asset.prompt,
      size: "1024x1024",
      background: "transparent",
      output_format: "png"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Image generation failed for ${asset.file}: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const image = payload.data?.[0]?.b64_json;

  if (!image) {
    throw new Error(`Image generation response did not include b64_json for ${asset.file}.`);
  }

  writeFileSync(join(OUTPUT_DIR, asset.file), Buffer.from(image, "base64"));
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const asset of ASSETS) {
    process.stdout.write(`Generating ${asset.file}...\n`);
    await generateAsset(asset);
  }

  process.stdout.write(`Saved ${ASSETS.length} optional sprites to ${OUTPUT_DIR}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
