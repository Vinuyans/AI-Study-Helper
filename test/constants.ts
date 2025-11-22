import { ImageSize } from './types';

export const GEMINI_CHAT_MODEL = 'gemini-3-pro-preview'; // For complex text tasks
export const GEMINI_IMAGE_GENERATION_MODEL = 'gemini-3-pro-image-preview'; // For high-quality image generation
export const GEMINI_IMAGE_EDITING_MODEL = 'gemini-2.5-flash-image'; // For image editing

export const DEFAULT_IMAGE_SIZE = ImageSize["1K"];
export const SUPPORTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// Placeholder image URL for UI elements where an image is expected but not yet generated/uploaded.
export const PLACEHOLDER_IMAGE_URL = 'https://picsum.photos/400/300';