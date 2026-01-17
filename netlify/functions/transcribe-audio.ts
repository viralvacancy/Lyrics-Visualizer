import { GoogleGenAI } from '@google/genai';

const buildPrompt = () => `You are a highly accurate audio transcription service.
Transcribe the provided audio file and generate lyrics in LRC format.
LRC format includes timestamps for each line, like [mm:ss.xx].
If the audio has no lyrics, just return "[00:00.00]Instrumental".
If transcription is not possible, return "[00:00.00]Transcription failed."`;

type RequestPayload = {
  data?: string;
  mimeType?: string;
  apiKey?: string;
};

export const handler = async (event: { httpMethod?: string; body?: string }) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const payload = event.body ? (JSON.parse(event.body) as RequestPayload) : {};
  const { data, mimeType, apiKey: userApiKey } = payload;

  // Use user provided key or fallback to environment variable
  const apiKey = userApiKey || process.env.API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing API Key. Please provide one or configure the server.' }),
    };
  }

  if (!data || !mimeType) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing audio payload.' }),
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data,
              mimeType,
            },
          },
          { text: buildPrompt() },
        ],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ text: result.text?.trim() ?? '' }),
    };
  } catch (error) {
    console.error('Gemini transcription failed', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Transcription failed.' }),
    };
  }
};
