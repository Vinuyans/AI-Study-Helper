// backend/backend.js
import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001; // Default to port 3001
const API_KEY = process.env.API_KEY;

// --- Constants (Duplicated from frontend for consistency) ---
const GEMINI_CHAT_MODEL = 'gemini-2.5-pro'; // For complex text tasks
const GEMINI_IMAGE_GENERATION_MODEL = 'gemini-2.5-flash-image'; // For high-quality image generation
const GEMINI_IMAGE_EDITING_MODEL = 'gemini-2.5-flash-image'; // For image editing
// --- End Constants ---

// Middleware
// Enable CORS for the frontend running on localhost:3000
app.use(cors({ origin: 'http://localhost:3000' }));
// Parse JSON request bodies, increase limit for image uploads
app.use(express.json({ limit: '50mb' }));

// Initialize GoogleGenAI
let ai;
if (!API_KEY) {
    console.error('ERROR: API_KEY environment variable is not set.');
    console.error('Please ensure you have a .env file with API_KEY=YOUR_GEMINI_API_KEY_HERE in your backend directory, or set it in your environment.');
    process.exit(1); // Exit if API key is not available
} else {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log('Gemini API initialized successfully.');
}

// Helper to convert base64 image data to a data URL
function toDataUrl(base64Data, mimeType) {
    return `data:${mimeType};base64,${base64Data}`;
}

// --- API Endpoints ---

/**
 * Endpoint for streaming chat responses from Gemini.
 * Frontend: services/geminiService.ts -> sendMessageStream
 */
app.post('/api/chat/stream', async (req, res) => {
    if (!ai) return res.status(500).json({ message: 'Gemini API is not initialized. Check API_KEY.' });

    const { message, history } = req.body;

    if (!message || !history) {
        return res.status(400).json({ message: 'Missing message or history in request body.' });
    }

    // Map frontend history format to Gemini API content format
    const contents = history.map(entry => ({
        role: entry.role,
        parts: entry.parts.map(part => ({ text: part.text })),
    }));
    contents.push({ role: 'user', parts: [{ text: message }] }); // Add the current user message

    try {
        // Define a system instruction for the chat model on the backend
        const systemInstruction = 'You are a helpful study buddy. You can answer questions, summarize topics, and help with learning materials. Keep responses concise and to the point.';

        const streamResponse = await ai.models.generateContentStream({
            model: GEMINI_CHAT_MODEL,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        // Set headers for streaming JSON responses
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Transfer-Encoding': 'chunked',
            'Connection': 'keep-alive',
        });

        for await (const chunk of streamResponse) {
            if (chunk.text) {
                // Frontend expects { text: "..." } JSON objects
                res.write(JSON.stringify({ text: chunk.text }));
            }
        }
        res.end(); // End the stream

    } catch (error) {
        console.error('Error in /api/chat/stream:', error);
        // If headers haven't been sent, send an error response. Otherwise, just end the stream.
        if (!res.headersSent) {
             res.status(500).json({ message: 'Failed to stream response from Gemini API.', error: error.message });
        } else {
            res.end();
        }
    }
});

/**
 * Endpoint for generating text with context (Document AI).
 * Frontend: services/geminiService.ts -> generateTextWithContext
 */
app.post('/api/document-ai/generate', async (req, res) => {
    if (!ai) return res.status(500).json({ message: 'Gemini API is not initialized. Check API_KEY.' });

    const { prompt, context } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Missing prompt in request body.' });
    }

    const contents = [];
    if (context) {
        // Add context as a separate part or combined with the prompt
        contents.push({ text: `Analyze the following documents:\n${context}` });
    }
    contents.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL, // Using chat model for document AI tasks
            contents: contents,
            // System instruction for document AI can be embedded in prompt or config if specific
            // For general Q&A/summarization, the chat model works well.
        });
        res.json({ text: response.text });
    } catch (error) {
        console.error('Error in /api/document-ai/generate:', error);
        res.status(500).json({ message: 'Failed to generate text from Gemini API.', error: error.message });
    }
});

/**
 * Endpoint for generating images.
 * Frontend: services/geminiService.ts -> generateImage
 */
app.post('/api/image/generate', async (req, res) => {
    if (!ai) return res.status(500).json({ message: 'Gemini API is not initialized. Check API_KEY.' });

    const { prompt, imageSize } = req.body;

    if (!prompt || !imageSize) {
        return res.status(400).json({ message: 'Missing prompt or imageSize in request body.' });
    }

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_IMAGE_GENERATION_MODEL, // Using high-quality image generation model
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                imageConfig: {
                    aspectRatio: "1:1", // Default to 1:1, could be configurable if desired
                    imageSize: imageSize,
                },
            },
        });

        const imageUrls = [];
        // Iterate through all candidates and parts to find image data
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts || []) {
                if (part.inlineData) {
                    // Gemini 3 Pro Image Preview typically returns image/png
                    imageUrls.push(toDataUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png'));
                }
            }
        }

        if (imageUrls.length === 0) {
            return res.status(500).json({ message: 'Gemini API did not return an image for the given prompt.' });
        }
        res.json({ imageUrls: imageUrls });

    } catch (error) {
        console.error('Error in /api/image/generate:', error);
        res.status(500).json({ message: 'Failed to generate image from Gemini API.', error: error.message });
    }
});

/**
 * Endpoint for editing images.
 * Frontend: services/geminiService.ts -> editImage
 */
app.post('/api/image/edit', async (req, res) => {
    if (!ai) return res.status(500).json({ message: 'Gemini API is not initialized. Check API_KEY.' });

    const { base64Image, mimeType, prompt } = req.body;

    if (!base64Image || !mimeType || !prompt) {
        return res.status(400).json({ message: 'Missing base64Image, mimeType, or prompt in request body.' });
    }

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_IMAGE_EDITING_MODEL, // Using image editing model
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image, // Frontend sends raw base64 string
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
        });

        const imageUrls = [];
        // Iterate through all candidates and parts to find image data
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts || []) {
                if (part.inlineData) {
                    imageUrls.push(toDataUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png'));
                }
            }
        }

        if (imageUrls.length === 0) {
            return res.status(500).json({ message: 'Gemini API did not return an edited image.' });
        }
        res.json({ imageUrls: imageUrls });

    } catch (error) {
        console.error('Error in /api/image/edit:', error);
        res.status(500).json({ message: 'Failed to edit image from Gemini API.', error: error.message });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});