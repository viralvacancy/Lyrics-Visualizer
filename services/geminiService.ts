type TranscriptionResponse = {
  text?: string;
  error?: string;
};

// Helper to convert File to base64 for the Gemini API
const fileToBase64Payload = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  return {
    data: await base64EncodedDataPromise,
    mimeType: file.type,
  };
};

export const transcribeAudio = async (audioFile: File, apiKey?: string): Promise<string> => {
  const audioPayload = await fileToBase64Payload(audioFile);
  const payload = {
    ...audioPayload,
    apiKey,
  };

  try {
    const response = await fetch('/.netlify/functions/transcribe-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Transcription failed with status ${response.status}`);
    }

    const data = (await response.json()) as TranscriptionResponse;

    if (data.error) {
      console.error('Error transcribing audio with Gemini:', data.error);
      return `[00:00.00]Transcription failed: API error.`;
    }

    const lrcContent = data.text?.trim() ?? '';

    if (lrcContent.startsWith('[') && lrcContent.includes(']')) {
      return lrcContent;
    }

    console.warn('Gemini response was not in expected LRC format:', lrcContent);
    return `[00:00.00]Transcription failed: Invalid format.`;
  } catch (error) {
    console.error('Error transcribing audio with Gemini:', error);
    return `[00:00.00]Transcription failed: API error.`;
  }
};
