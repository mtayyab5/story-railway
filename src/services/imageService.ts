import OpenAI from "openai";
import { config } from "../lib/config";
import { SceneImage, StoryScene } from "../types/story";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function generateImages(
  scenes: StoryScene[],
  artStyle: string = "digital illustration, storybook style, vibrant colors, highly detailed"
): Promise<SceneImage[]> {
  const results: SceneImage[] = [];

  for (const [index, scene] of scenes.entries()) {
    const fullPrompt = `${scene.imagePrompt}. Art style: ${artStyle}. Cinematic composition, professional quality.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
      });

      const imageData = response.data?.[0];
      if (!imageData) {
        throw new Error("No image returned from OpenAI");
      }

      results.push({
        sceneNumber: scene.sceneNumber,
        sceneTitle: scene.title,
        imageUrl: imageData.url || "",
        revisedPrompt: imageData.revised_prompt || fullPrompt,
      });

      if (index < scenes.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch {
      results.push({
        sceneNumber: scene.sceneNumber,
        sceneTitle: scene.title,
        imageUrl: "",
        revisedPrompt: fullPrompt,
      });
    }
  }

  return results;
}
