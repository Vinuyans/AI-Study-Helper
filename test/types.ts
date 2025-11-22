export enum ImageSize {
  "1K" = "1K",
  "2K" = "2K",
  "4K" = "4K",
}

export enum Feature {
  CHATBOT = 'chatbot',
  DOCUMENT_AI = 'document_ai',
  IMAGE_GENERATION = 'image_generation',
  IMAGE_EDITING = 'image_editing',
}

export interface ChatEntry {
  id: string;
  role: 'user' | 'model'; // System messages are internal/config, not part of displayed chat history
  parts: Array<{ text: string }>;
  timestamp: Date;
}

export interface DocumentEntry {
  id: string;
  name: string;
  content: string; // The text content of the document
}

export interface ImageGenerationPayload {
  prompt: string;
  imageSize: ImageSize;
}

export interface ImageEditingPayload {
  prompt: string;
  base64Image: string;
  mimeType: string;
}

export interface ImageResult {
  url: string; // data:image/png;base64,...
  description?: string; // model's description or generation prompt
}
