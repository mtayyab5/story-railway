import OpenAI from "openai";
import { config } from "../lib/config";
import { StoryResult, StoryScene } from "../types/story";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

interface RawStoryResponse {
  title: string;
  genre?: string;
  scenes: StoryScene[];
}

export async function generateStory(
  prompt: string,
  genre: string,
  numScenes: number,
  targetAudience: string
): Promise<StoryResult> {
  const systemPrompt = `You are a creative storyteller. Generate engaging, vivid stories split into scenes.
Always respond with ONLY valid JSON — no markdown, no backticks, no extra text.
Use this exact structure:
{
  "title": "Story Title Here",
  "genre": "genre name",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene Title",
      "content": "Full scene text, 2-3 rich paragraphs.",
      "imagePrompt": "Detailed visual description for DALL-E 3, 1-2 sentences. Include setting, characters, mood, lighting, and art style hint."
    }
  ]
}`;

  const userPrompt = `Write a ${genre} story for a ${targetAudience} audience.
Story idea: "${prompt}"
Split it into exactly ${numScenes} scenes.
Make each imagePrompt highly specific and visually descriptive for DALL-E 3 image generation.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.85,
    max_tokens: 4000,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw) as RawStoryResponse;

  if (!parsed.title || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error("Invalid story response returned by OpenAI.");
  }

  const fullStory = parsed.scenes
    .map((scene) => `## ${scene.title}\n\n${scene.content}`)
    .join("\n\n---\n\n");

  return {
    title: parsed.title,
    genre: parsed.genre || genre,
    totalScenes: parsed.scenes.length,
    scenes: parsed.scenes,
    fullStory,
  };
}
