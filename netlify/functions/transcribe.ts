import { GoogleGenAI } from "@google/genai";
import type { Handler } from "@netlify/functions";

type TranscribeRequest = {
  audio?: string;
  mimeType?: string;
};

type TranscribeResponse = {
  lrcContent: string;
};

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const headerKey = event.headers?.['x-api-key'];

  const apiKey = (headerKey as string | undefined)?.trim() || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY environment variable");
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server configuration error." }),
    };
  }

  try {
    const payload: TranscribeRequest = JSON.parse(event.body || "{}");
    if (!payload.audio || !payload.mimeType) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing audio data." }),
      };
    }

    const prompt = `You are a highly accurate audio transcription service.
    Transcribe the provided audio file and generate lyrics in LRC format.
    LRC format includes timestamps for each line, like [mm:ss.xx].
    If the audio has no lyrics, just return "[00:00.00]Instrumental".
    If transcription is not possible, return "[00:00.00]Transcription failed."`;

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { data: payload.audio, mimeType: payload.mimeType } },
          { text: prompt },
        ],
      },
    });

    const lrcContent = result.text?.trim() ?? "";
    const sanitized: TranscribeResponse = {
      lrcContent:
        lrcContent && lrcContent.startsWith("[") && lrcContent.includes("]")
          ? lrcContent
          : "[00:00.00]Transcription failed: Invalid format.",
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitized),
    };
  } catch (error) {
    console.error("Error transcribing audio with Gemini:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Transcription failed." }),
    };
  }
};

export { handler };
