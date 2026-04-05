import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { ZodError } from "zod";
import { config } from "./lib/config";
import {
  exportPdfRequestSchema,
  generateFullStoryRequestSchema,
  generateImagesRequestSchema,
  generateStoryRequestSchema,
} from "./lib/schemas";
import { generateStory } from "./services/storyService";
import { generateImages } from "./services/imageService";
import { cleanupOldPdfs, exportPdf } from "./services/pdfService";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/download", express.static(path.join(process.cwd(), "public", "pdfs")));

function handleError(error: unknown, res: Response): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Invalid request body",
      details: error.issues,
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Unknown server error";
  res.status(500).json({ success: false, error: message });
}

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "story-api-railway",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Story API for Railway",
    health: `${config.baseUrl}/health`,
    endpoints: {
      generate_story: `${config.baseUrl}/api/generate-story`,
      generate_images: `${config.baseUrl}/api/generate-images`,
      export_pdf: `${config.baseUrl}/api/export-pdf`,
      generate_full_story_with_pdf: `${config.baseUrl}/api/generate-full-story-with-pdf`,
    },
  });
});

app.post("/api/generate-story", async (req: Request, res: Response) => {
  try {
    const body = generateStoryRequestSchema.parse(req.body);
    const story = await generateStory(body.prompt, body.genre, body.scenes, body.target_audience);

    res.json({
      success: true,
      story: {
        title: story.title,
        genre: story.genre,
        totalScenes: story.totalScenes,
        scenes: story.scenes,
        fullStory: story.fullStory,
      },
      next_steps: "Call /api/generate-images with the scenes array, then /api/export-pdf.",
    });
  } catch (error) {
    handleError(error, res);
  }
});

app.post("/api/generate-images", async (req: Request, res: Response) => {
  try {
    const body = generateImagesRequestSchema.parse(req.body);
    const images = await generateImages(body.scenes, body.art_style);
    const ok = images.filter((img) => img.imageUrl).length;

    res.json({
      success: true,
      images: images.map((img) => ({
        sceneNumber: img.sceneNumber,
        sceneTitle: img.sceneTitle,
        imageUrl: img.imageUrl,
        revisedPrompt: img.revisedPrompt,
      })),
      summary: `${ok} of ${images.length} images generated successfully.`,
      next_steps: "Call /api/export-pdf with the story object and this images array.",
    });
  } catch (error) {
    handleError(error, res);
  }
});

app.post("/api/export-pdf", async (req: Request, res: Response) => {
  try {
    const body = exportPdfRequestSchema.parse(req.body);
    const imagesWithRevised = body.images.map((img) => ({
      sceneNumber: img.sceneNumber,
      sceneTitle: img.sceneTitle,
      imageUrl: img.imageUrl,
      revisedPrompt: img.revisedPrompt || "",
    }));

    const pdf = await exportPdf(body.story, imagesWithRevised);
    res.json({
      success: true,
      pdf: {
        filename: pdf.filename,
        downloadUrl: pdf.downloadUrl,
        sizeKb: pdf.sizeKb,
        expiresIn: "1 hour",
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

app.post("/api/generate-full-story-with-pdf", async (req: Request, res: Response) => {
  try {
    const body = generateFullStoryRequestSchema.parse(req.body);
    const story = await generateStory(body.prompt, body.genre, body.scenes, body.target_audience);
    const images = await generateImages(story.scenes, body.art_style);
    const pdf = await exportPdf(story, images);

    res.json({
      success: true,
      story: {
        title: story.title,
        genre: story.genre,
        totalScenes: story.totalScenes,
        fullStory: story.fullStory,
        scenes: story.scenes,
      },
      images,
      pdf: {
        filename: pdf.filename,
        downloadUrl: pdf.downloadUrl,
        sizeKb: pdf.sizeKb,
        expiresIn: "1 hour",
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

app.listen(config.port, () => {
  console.log(`Story API running on ${config.baseUrl}`);
});

setInterval(cleanupOldPdfs, 30 * 60 * 1000);
