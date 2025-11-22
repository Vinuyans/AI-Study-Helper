import { GenerateContentResponse } from "@google/genai"; 

const BACKEND_API_BASE_URL = 'http://localhost:5000/api/chat'; 
const SUPPORTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Converts a File object to a base64 string.
 * @param file - The file to convert.
 * @returns  A promise that resolves with the base64 encoded string.
 */
export const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read file as Data URL."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Sends a message to the chat model via the backend and streams the response.
 * @param {string} message - The user's message.
 * @param {Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>} history - The chat history (excluding system instruction for backend).
 * @returns {AsyncGenerator<GenerateContentResponse>} An async generator yielding chunks of the response.
 */
export async function* sendMessageStream( message, history) {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        history: history
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get stream response from backend.');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get readable stream from response.');
    }

    const decoder = new TextDecoder('utf-8');
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      try {
        const parsedChunk = JSON.parse(chunk);
        yield { text: parsedChunk.text || '' };
      } catch (parseError) {
        console.log(parseError);
        console.warn('Could not parse chunk as JSON, treating as plain text:', chunk);
        yield { text: chunk };
      }
    }
  } catch (error) {
    console.error('Error sending message to backend chat endpoint:', error);
    throw error;
  }
}

/**
 * Generates text using the Gemini model via the backend with optional context.
 * @param {string} prompt - The text prompt for the model.
 * @param {string} [context] - Optional context or document content to include.
 * @returns {Promise<string>} A promise that resolves with the generated text.
 */
export const generateTextWithContext = async (prompt, context) => {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/document-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        context: context
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate text with context from backend.');
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Error generating text with context via backend:', error);
    throw error;
  }
};

