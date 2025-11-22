import { GenerateContentResponse } from "@google/genai"; // Keep GenerateContentResponse for type hinting return values
import {
  GEMINI_CHAT_MODEL,
  GEMINI_IMAGE_GENERATION_MODEL,
  GEMINI_IMAGE_EDITING_MODEL,
  SUPPORTED_IMAGE_MIME_TYPES,
} from '../constants';
import { ImageSize } from '../types';

/**
 * Base URL for your backend API.
 * This should be configured to point to your actual backend server.
 */
const BACKEND_API_BASE_URL = 'http://localhost:3001/api'; // Replace with your actual backend URL

/**
 * Converts a File object to a base64 string.
 * @param {File} file - The file to convert.
 * @returns {Promise<string>} A promise that resolves with the base64 encoded string.
 */
export const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]); // Get only the base64 part
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
export async function* sendMessageStream(
  message: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
): AsyncGenerator<GenerateContentResponse> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMINI_CHAT_MODEL,
        message: message,
        history: history,
        // System instruction is now handled by the backend's chat session creation
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
      // Assuming backend sends chunks that can be directly used as GenerateContentResponse
      // or at least have a 'text' property. Adjust parsing if backend sends different format.
      try {
        const parsedChunk = JSON.parse(chunk); // Assuming each chunk is a JSON string
        yield { text: parsedChunk.text || '' } as GenerateContentResponse;
      } catch (parseError) {
        console.warn('Could not parse chunk as JSON, treating as plain text:', chunk);
        yield { text: chunk } as GenerateContentResponse; // Fallback for plain text chunks
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
export const generateTextWithContext = async (prompt: string, context?: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/document-ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMINI_CHAT_MODEL,
        prompt: prompt,
        context: context,
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


/**
 * Generates an image based on a text prompt and desired image size via the backend.
 * @param {string} prompt - The text prompt for image generation.
 * @param {ImageSize} imageSize - The desired image resolution (1K, 2K, 4K).
 * @returns {Promise<string[]>} A promise that resolves with an array of base64 image URLs.
 */
export const generateImage = async (prompt: string, imageSize: ImageSize): Promise<string[]> => {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMINI_IMAGE_GENERATION_MODEL,
        prompt: prompt,
        imageSize: imageSize,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate image from backend.');
    }

    const data = await response.json();
    // Assuming backend returns an object with an `imageUrls` property
    return data.imageUrls || [];
  } catch (error) {
    console.error('Error generating image via backend:', error);
    throw error;
  }
};

/**
 * Edits an existing image based on a text prompt via the backend.
 * @param {string} base64Image - The base64 encoded string of the image to edit (without data URL prefix).
 * @param {string} mimeType - The MIME type of the image (e.g., 'image/png').
 * @param {string} prompt - The text prompt describing the edits.
 * @returns {Promise<string[]>} A promise that resolves with an array of base64 image URLs of the edited images.
 */
export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string[]> => {
  if (!SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image MIME type for editing: ${mimeType}. Supported types are: ${SUPPORTED_IMAGE_MIME_TYPES.join(', ')}`);
  }

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/image/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMINI_IMAGE_EDITING_MODEL,
        base64Image: base64Image,
        mimeType: mimeType,
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to edit image from backend.');
    }

    const data = await response.json();
    // Assuming backend returns an object with an `imageUrls` property
    return data.imageUrls || [];
  } catch (error) {
    console.error('Error editing image via backend:', error);
    throw error;
  }
};
