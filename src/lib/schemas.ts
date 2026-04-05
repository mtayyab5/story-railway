import { z } from "zod";

export const genreSchema = z.enum([
  "fantasy",
  "sci-fi",
  "romance",
  "mystery",
  "adventure",
  "horror",
  "fairy-tale",
  "thriller",
]);

export const audienceSchema = z.enum([
  "children",
  "young-adult",
  "general",
  "adult",
]);

export const storySceneSchema = z.object({
  sceneNumber: z.number(),
  title: z.string(),
  content: z.string(),
  imagePrompt: z.string(),
});

export const storySchema = z.object({
  title: z.string(),
  genre: z.string(),
  totalScenes: z.number(),
  scenes: z.array(storySceneSchema),
  fullStory: z.string(),
});

export const sceneImageSchema = z.object({
  sceneNumber: z.number(),
  sceneTitle: z.string(),
  imageUrl: z.string(),
  revisedPrompt: z.string().optional(),
});

export const generateStoryRequestSchema = z.object({
  prompt: z.string().min(5),
  genre: genreSchema.default("fantasy"),
  scenes: z.number().int().min(2).max(8).default(4),
  target_audience: audienceSchema.default("general"),
});

export const generateImagesRequestSchema = z.object({
  scenes: z.array(storySceneSchema).min(1),
  art_style: z
    .string()
    .default("digital illustration, storybook style, vibrant colors, highly detailed"),
});

export const exportPdfRequestSchema = z.object({
  story: storySchema,
  images: z.array(sceneImageSchema).default([]),
});

export const generateFullStoryRequestSchema = z.object({
  prompt: z.string().min(5),
  genre: genreSchema.default("fantasy"),
  scenes: z.number().int().min(2).max(6).default(4),
  target_audience: audienceSchema.default("general"),
  art_style: z
    .string()
    .default("digital illustration, storybook style, vibrant colors, highly detailed"),
});
