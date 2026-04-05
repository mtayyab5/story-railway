import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing. Add it to your environment variables.`);
  }
  return value;
}

export const config = {
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  port: parseInt(process.env.PORT || "3000", 10),
  baseUrl: (process.env.BASE_URL || `http://localhost:${process.env.PORT || "3000"}`).replace(/\/$/, ""),
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
};
