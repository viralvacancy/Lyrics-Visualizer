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

export const transcribeAudio = async (audioFile: File): Promise<string> => {
  const audioData = await fileToBase64(audioFile);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const apiKey = getStoredApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  try {
    const response = await fetch('/.netlify/functions/transcribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        audio: audioData,
        mimeType: audioFile.type,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText || 'API error');
    }

    const data: { lrcContent?: string; error?: string } = await response.json();
    const lrcContent = data.lrcContent?.trim();

    if (lrcContent && lrcContent.startsWith('[') && lrcContent.includes(']')) {
      return lrcContent;
    }

    console.warn('Gemini response was not in expected LRC format:', lrcContent);
    throw new Error('Invalid format');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'API error';

    if (message === 'Invalid format') {
      return `[00:00.00]Transcription failed: Invalid format.`;
    }

    console.error('Error transcribing audio with Gemini:', error);
    return `[00:00.00]Transcription failed: API error.`;
  }
};

