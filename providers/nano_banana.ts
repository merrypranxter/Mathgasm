import { z } from "zod";

export const RenderRequest = z.object({
  prompt: z.string(),
  // future: initImage, controlImage, width/height, steps, guidance, seed...
  initImageBase64: z.string().optional(),
  seed: z.number().optional(),
});

export type RenderRequest = z.infer<typeof RenderRequest>;

/**
 * This is a stub. Replace the fetch() URL/body shape with Nano Banana’s real API.
 * Keep the signature stable so swapping providers is painless.
 */
export async function renderNanoBanana(req: RenderRequest): Promise<{ imageBase64: string }> {
  const apiKey = process.env.NANO_BANANA_API_KEY;
  if (!apiKey) throw new Error("Missing NANO_BANANA_API_KEY in environment.");

  const baseUrl = process.env.NANO_BANANA_BASE_URL || "https://api.nanobanana.example";

  // TODO: update with the real endpoint + payload for your provider.
  const resp = await fetch(baseUrl + "/v1/images/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: req.prompt,
      seed: req.seed,
      init_image: req.initImageBase64,
    }),
  });

  // For now, we hard-fail with a helpful error.
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Nano Banana API error (${resp.status}): ${text}`);
  }

  // TODO: parse real response
  // Expecting: { image_base64: "..." }
  try {
    const json = JSON.parse(text);
    const imageBase64 = json.image_base64 || json.imageBase64;
    if (!imageBase64) throw new Error("No image_base64 in response.");
    return { imageBase64: imageBase64.startsWith("data:") ? imageBase64 : "data:image/png;base64," + imageBase64 };
  } catch (e: any) {
    throw new Error("Could not parse Nano Banana response: " + e?.message + " | raw: " + text.slice(0, 500));
  }
}
