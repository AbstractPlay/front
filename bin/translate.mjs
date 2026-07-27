import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TARGET_LANGUAGES = [
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
];

function getDiffKeys(sourceObj, targetObj) {
  const diff = {};
  for (const [key, sourceValue] of Object.entries(sourceObj)) {
    // Ignore internal tracking keys
    if (key.startsWith("_src_")) continue;

    // Mark for translation if missing or source text updated
    if (!targetObj[key] || targetObj[`_src_${key}`] !== sourceValue) {
      diff[key] = sourceValue;
    }
  }
  return diff;
}

async function translateFile(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    console.error(`File not found: ${sourcePath}`);
    return;
  }

  const sourceData = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
  const dirPath = path.dirname(sourcePath);
  const baseDir = path.dirname(dirPath);
  const fileName = path.basename(sourcePath);

  for (const lang of TARGET_LANGUAGES) {
    const targetDir = path.join(baseDir, lang.code);
    const targetPath = path.join(targetDir, fileName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let targetData = {};
    if (fs.existsSync(targetPath)) {
      try {
        targetData = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
      } catch (e) {
        targetData = {};
      }
    }

    const diffKeys = getDiffKeys(sourceData, targetData);
    const keysToTranslate = Object.keys(diffKeys);

    if (keysToTranslate.length === 0) {
      console.log(`[${lang.code}] ${fileName}: 100% up to date. Skipping.`);
      continue;
    }

    console.log(`[${lang.code}] ${fileName}: Translating ${keysToTranslate.length} new/updated keys...`);

    const prompt = `
    You are an expert translator specializing in UI strings for abstract strategy board games (like Chess, Go, Tak, etc.).
    Translate the provided JSON key-value pairs from English to ${lang.name}.

    STRICT RULES:
    1. Preserve all placeholders verbatim (e.g. {{count}}, {{player}}, {0}, %s, HTML tags). Do not modify variables inside braces.
    2. Use natural tabletop gaming terms (e.g., "Pass", "Resign", "Stalemate", "Hand", "Pip", "Board").
    3. Return a JSON object matching the exact input keys supplied, with translated string values.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `${prompt}\n\nInput JSON:\n${JSON.stringify(diffKeys, null, 2)}`,
        config: {
          responseMimeType: "application/json",
        },
      });

      // Strip markdown code block formatting if present
      let rawText = response.text.trim();
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
      }

      const translatedChunk = JSON.parse(rawText);

      // Merge translations and update source tracking
      for (const [key, translatedValue] of Object.entries(translatedChunk)) {
        targetData[key] = translatedValue;
        targetData[`_src_${key}`] = sourceData[key];
      }

      // Reconstruct file maintaining original key ordering
      const cleanTargetData = {};
      for (const [k, v] of Object.entries(targetData)) {
        if (k.startsWith("_src_")) cleanTargetData[k] = v;
      }
      for (const k of Object.keys(sourceData)) {
        if (targetData[k]) cleanTargetData[k] = targetData[k];
      }

      fs.writeFileSync(targetPath, JSON.stringify(cleanTargetData, null, 2) + "\n");
      console.log(`[${lang.code}] ${fileName}: Updated successfully.`);
    } catch (err) {
      console.error(`[${lang.code}] ${fileName}: Error translating:`, err);
    }
  }
}

async function run() {
  const files = process.argv.slice(2);
  for (const file of files) {
    await translateFile(file);
  }
}

run();