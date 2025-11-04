import { GoogleGenAI } from "@google/genai";

// Helper to convert File to base64 for the Gemini API
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const transcribeAudio = async (audioFile: File, apiKey?: string | null): Promise<string> => {
    const resolvedApiKey = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;

    if (!resolvedApiKey) {
        throw new Error('A Gemini API key is required for transcription but was not provided.');
    }

    const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

    const audioPart = await fileToGenerativePart(audioFile);

    const prompt = `You are a highly accurate audio transcription service.
    Transcribe the provided audio file and generate lyrics in LRC format.
    LRC format includes timestamps for each line, like [mm:ss.xx].
    If the audio has no lyrics, just return "[00:00.00]Instrumental".
    If transcription is not possible, return "[00:00.00]Transcription failed."`;

    try {
        // FIX: Use ai.models.generateContent with the correct model and multimodal contents.
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, { text: prompt }] },
        });
        
        // FIX: Extract text directly from the response.text property.
        const lrcContent = result.text.trim();
        
        // Basic validation to ensure the response looks like LRC format.
        if (lrcContent.startsWith('[') && lrcContent.includes(']')) {
            return lrcContent;
        } else {
            console.warn("Gemini response was not in expected LRC format:", lrcContent);
            return `[00:00.00]Transcription failed: Invalid format.`;
        }

    } catch (error) {
        console.error('Error transcribing audio with Gemini:', error);
        return `[00:00.00]Transcription failed: API error.`;
    }
};
