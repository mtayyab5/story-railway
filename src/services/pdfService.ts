import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import { config } from "../lib/config";
import { PdfResult, SceneImage, StoryResult } from "../types/story";

function buildHtml(story: StoryResult, images: SceneImage[]): string {
  const imageMap = new Map(images.map((img) => [img.sceneNumber, img]));

  const scenesHtml = story.scenes
    .map((scene) => {
      const img = imageMap.get(scene.sceneNumber);

      const imgTag =
        img && img.imageUrl
          ? `<div class="scene-image"><img src="${img.imageUrl}" alt="Scene ${scene.sceneNumber}: ${scene.title}" /></div>`
          : `<div class="scene-image placeholder"><div class="placeholder-inner">✦ Scene ${scene.sceneNumber} ✦</div></div>`;

      const paragraphs = scene.content
        .split(/\n+/)
        .filter((p) => p.trim().length > 0)
        .map((p) => `<p>${p.trim()}</p>`)
        .join("\n");

      return `
      <div class="scene page-break">
        <div class="scene-header">
          <div class="scene-label">Scene ${scene.sceneNumber} of ${story.totalScenes}</div>
          <h2 class="scene-title">${scene.title}</h2>
          <div class="scene-divider"></div>
        </div>
        ${imgTag}
        <div class="scene-body">${paragraphs}</div>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { font-family: Georgia, 'Times New Roman', serif; background: #ffffff; color: #1a1208; font-size: 16px; line-height: 1.85; }
    .cover { width: 100%; height: 100vh; min-height: 800px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(155deg, #0f0524 0%, #1e0a4a 40%, #0a2a5e 100%); color: #ffffff; text-align: center; padding: 60px 48px; page-break-after: always; }
    .cover-star { font-size: 48px; opacity: 0.7; margin-bottom: 40px; letter-spacing: 16px; }
    .cover-genre-badge { display: inline-block; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 5px; text-transform: uppercase; color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.4); padding: 6px 20px; border-radius: 100px; margin-bottom: 40px; }
    .cover-title { font-size: 56px; font-weight: bold; line-height: 1.12; color: #f5f0ff; margin-bottom: 40px; max-width: 640px; text-shadow: 0 2px 40px rgba(100, 60, 255, 0.35); }
    .cover-line { width: 64px; height: 1px; background: rgba(167, 139, 250, 0.5); margin: 0 auto 32px; }
    .cover-meta { font-family: Arial, sans-serif; font-size: 13px; color: rgba(200, 185, 255, 0.7); letter-spacing: 2px; }
    .scene { padding: 72px 80px; max-width: 860px; margin: 0 auto; }
    .page-break { page-break-after: always; }
    .scene-header { margin-bottom: 36px; }
    .scene-label { font-family: Arial, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: #7c3aed; margin-bottom: 10px; }
    .scene-title { font-size: 30px; font-weight: bold; color: #0f0524; line-height: 1.25; margin-bottom: 20px; }
    .scene-divider { width: 48px; height: 3px; background: linear-gradient(90deg, #7c3aed, #a78bfa); border-radius: 2px; }
    .scene-image { width: 100%; border-radius: 14px; overflow: hidden; margin-bottom: 36px; box-shadow: 0 12px 48px rgba(15, 5, 36, 0.14); }
    .scene-image img { width: 100%; height: 340px; object-fit: cover; display: block; }
    .scene-image.placeholder { height: 160px; background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); display: flex; align-items: center; justify-content: center; }
    .placeholder-inner { font-family: Arial, sans-serif; font-size: 14px; letter-spacing: 4px; color: #7c3aed; opacity: 0.6; }
    .scene-body p { font-size: 16.5px; line-height: 1.9; margin-bottom: 20px; color: #1a1208; text-align: justify; hyphens: auto; }
    .scene-body p:first-child::first-letter { font-size: 64px; font-weight: bold; float: left; line-height: 0.75; margin: 8px 12px 0 0; color: #7c3aed; font-family: Georgia, serif; }
    .end-page { height: 100vh; min-height: 600px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(155deg, #0f0524 0%, #1e0a4a 60%, #0a2a5e 100%); color: #ffffff; text-align: center; padding: 60px; }
    .end-star { font-size: 36px; opacity: 0.5; letter-spacing: 12px; margin-bottom: 28px; }
    .end-title { font-size: 36px; color: #f5f0ff; margin-bottom: 16px; }
    .end-sub { font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 3px; color: rgba(167, 139, 250, 0.55); text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-star">✦ ✦ ✦</div>
    <div class="cover-genre-badge">${story.genre}</div>
    <h1 class="cover-title">${story.title}</h1>
    <div class="cover-line"></div>
    <div class="cover-meta">${story.totalScenes} illustrated scenes &nbsp;·&nbsp; AI Generated</div>
  </div>
  ${scenesHtml}
  <div class="end-page">
    <div class="end-star">✦ ✦ ✦</div>
    <div class="end-title">The End</div>
    <div class="end-sub">Generated by Story API</div>
  </div>
</body>
</html>`;
}

export async function exportPdf(story: StoryResult, images: SceneImage[]): Promise<PdfResult> {
  const outputDir = path.join(process.cwd(), "public", "pdfs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `story-${uuidv4()}.pdf`;
  const filePath = path.join(outputDir, filename);
  const html = buildHtml(story, images);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: config.puppeteerExecutablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 90000 });
    await page.evaluate(() => {
      const images = Array.from(document.images) as HTMLImageElement[];
      return Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
        )
      );
    });

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
  } finally {
    await browser.close();
  }

  const stats = fs.statSync(filePath);
  return {
    filename,
    filePath,
    sizeKb: Math.round(stats.size / 1024),
    downloadUrl: `${config.baseUrl}/download/${filename}`,
  };
}

export function cleanupOldPdfs(): void {
  const outputDir = path.join(process.cwd(), "public", "pdfs");
  if (!fs.existsSync(outputDir)) return;

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const file of fs.readdirSync(outputDir)) {
    const filePath = path.join(outputDir, file);
    try {
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < oneHourAgo) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // ignore
    }
  }
}
