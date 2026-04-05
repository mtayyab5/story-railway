export interface StoryScene {
  sceneNumber: number;
  title: string;
  content: string;
  imagePrompt: string;
}

export interface StoryResult {
  title: string;
  genre: string;
  totalScenes: number;
  scenes: StoryScene[];
  fullStory: string;
}

export interface SceneImage {
  sceneNumber: number;
  sceneTitle: string;
  imageUrl: string;
  revisedPrompt: string;
}

export interface PdfResult {
  filename: string;
  downloadUrl: string;
  filePath: string;
  sizeKb: number;
}
