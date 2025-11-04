import { getStoredApiKey } from '../utils/apiKeyStorage';

// Helper to convert File to base64 for sending to the Netlify function
const fileToBase64 = async (file: File): Promise<string> => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string | null;
      if (!result) {
        reject(new Error('Unable to read file.'));
        return;
      }
      const [, base64] = result.split(',');
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return base64EncodedDataPromise;
};

export const transcribeAudio = async (audioFile: File, apiKey?: string | null): Promise<string> => {
    const resolvedApiKey = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;

    if (!resolvedApiKey) {
        throw new Error('A Gemini API key is required for transcription but was not provided.');
    }

    const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

    const audioPart = await fileToGenerativePart(audioFile);

    if (!response.ok) {
      throw new Error(response.statusText || 'API error');
    }

    const data: { lrcContent?: string; error?: string } = await response.json();
    const lrcContent = data.lrcContent?.trim();

    if (lrcContent && lrcContent.startsWith('[') && lrcContent.includes(']')) {
      return lrcContent;
    }

    console.warn('Gemini response was not in expected LRC format:', lrcContent);
    return `[00:00.00]Transcription failed: Invalid format.`;
  } catch (error) {
    console.error('Error transcribing audio with Gemini:', error);
    return `[00:00.00]Transcription failed: API error.`;
  }
};

