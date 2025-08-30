import { model } from "./firebaseConfig.js";
import { parseFallback } from "./fallbackParser.js";

export async function parseWithGemini(transcript, lang = "auto") {
  // If no model available, use local fallback parser
  if (!model) {
    console.log("[Parser] Using fallback: no Gemini model configured");
    return parseFallback(transcript, lang);
  }

  const prompt = `
    You are a command parser for a shopping-list app. Input variables: transcript="${transcript}", language_hint="${lang}" (may be "auto").
    Output JSON only (no surrounding text) exactly in this schema:

    {
    "action": "add" | "remove" | "search" | null,
    "item": "<original item phrase, trimmed, as-said, with FIRST letter UPPERCASED>",
    "normalized_item": "<canonical singular English noun phrase, lowercase>",
    "quantity": <integer >= 1>
    }

    Rules:
    - Detect intent: add/remove/search. If intent cannot be determined, set action=null and item="" and normalized_item="" and quantity=1.
    - "item": preserve user's phrase (keep adjectives like "organic"), trim whitespace, but ensure the first character is uppercase.
    - "normalized_item": canonical English singular form, lowercase. Lemmatize plurals (apples -> apple), normalize common synonyms (e.g., दूध -> milk), remove numeric/price/filters ("under $5"), remove filler words.
    - Parse quantities from numerals and spoken numbers in any language (e.g., "दो","two"), handle multipliers ("dozen"=12), round fractional amounts up, minimum 1.
    - Handle multilingual input: detect language_hint or auto-detect, interpret numbers/words in that language, then produce normalized_item in English.
    - If the text is chit-chat or ambiguous (not a shopping command), return action=null and empty item fields.

    Examples:
    "add 2 apples" ->
    {"action":"add","item":"2 apples","normalized_item":"apple","quantity":2}

    "मेरी सूची से दूध हटाओ" ->
    {"action":"remove","item":"दूध","normalized_item":"milk","quantity":1}

    "Find organic apples under $5" ->
    {"action":"search","item":"Organic apples under $5","normalized_item":"organic apple","quantity":1}

    "please add half a dozen eggs" ->
    {"action":"add","item":"Half a dozen eggs","normalized_item":"egg","quantity":6}

    Return JSON only.
    `;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["add", "remove", "search", null],
            nullable: true,
          },
          item: { type: "string", nullable: true },
          normalized_item: { type: "string", nullable: true },
          quantity: { type: "integer", minimum: 1, default: 1 },
        },
        required: ["action", "item", "normalized_item", "quantity"],
      },
    },
  });

  // parse and post-process safely
  const text = await result.response.text();
  console.log("[Parser] Gemini raw response:", text);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.log("[Parser] Using fallback: Gemini response was not valid JSON");
    return parseFallback(transcript, lang);
  }

  // if model returned missing or empty required fields, fallback
  if (!json || (json.action === undefined && json.item === undefined)) {
    console.log(
      "[Parser] Using fallback: Gemini response missing required fields"
    );
    return parseFallback(transcript, lang);
  }

  const rawItem = (json.item ?? "").toString().trim();
  const item =
    rawItem.length === 0
      ? ""
      : rawItem.charAt(0).toUpperCase() + rawItem.slice(1);
      
  const normalized = (json.normalized_item ?? "")
    .toString()
    .trim()
    .toLowerCase();
  const quantity = Number.isFinite(json.quantity)
    ? Math.max(1, Math.round(json.quantity))
    : 1;

  // If model returned null action or empty item, keep as-is; otherwise ensure values are safe
  if (!normalized) {
    // allow local heuristic via fallbackParser to generate a normalized_item
    const fb = parseFallback(transcript, lang);
    console.log("[Parser] Parsed with Gemini, merged fallback normalization");
    return {
      action: json.action === null ? null : json.action,
      item,
      normalized_item: fb.normalized_item || "",
      quantity: Math.max(1, quantity || fb.quantity || 1),
    };
  }

  console.log("[Parser] Parsed with Gemini");
  return {
    action: json.action === null ? null : json.action,
    item,
    normalized_item: normalized,
    quantity,
  };
}
