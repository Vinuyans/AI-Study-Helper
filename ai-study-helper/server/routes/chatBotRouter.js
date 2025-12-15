import { Router } from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from '@google/genai';
import { getContext } from "./fileRouter.js";
import { optimizeSchedulePrompt, generateSchedulePrompt } from "./prompts.js";

dotenv.config({ path: "./.env" });
const API_KEY = process.env.API_KEY;
const GEMINI_CHAT_MODEL = 'gemini-2.5-flash-lite';
const CUSTOM_PRE_PROMPT = 'You are a helpful study buddy. You can answer questions, summarize topics, and help with learning materials. Keep responses concise and to the point.';


let ai;
if (!API_KEY) {
    console.error('ERROR: API_KEY environment variable is not set.');
    console.error('Please ensure you have a .env file with API_KEY=YOUR_GEMINI_API_KEY_HERE in your backend directory, or set it in your environment.');
    process.exit(1);
} else {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log('Gemini API initialized successfully.');
}

const chatBotRouter = Router();

// Helper to convert base64 image data to a data URL
function toDataUrl(base64Data, mimeType) {
    return `data:${mimeType};base64,${base64Data}`;
}


/**
 * Endpoint for streaming chat responses from Gemini.
 * 
 */
chatBotRouter.post('/stream', async (req, res) => {
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
        let systemInstruction = CUSTOM_PRE_PROMPT;

        // Get document context as a string
        let documentContext = (await getContext()).join("\n\n");

        if (documentContext && documentContext.trim() !== '') {
            let contextMessage = "\n\nWhen responding to my prompt, refer primarily to the Uploaded Document Context to ";
            contextMessage += "inform repsonses. If my prompt is not related to the document context, then refer to broader ";
            contextMessage += "general knowledge to answer instead. The response should clearly be based either on general knowledge ";
            contextMessage += "or specifically on the document context information. You don't need to mention which one it is; it should ";
            contextMessage +=  "be obvious from the content of the response where the information is coming from.";

            // Add documentContext to contents
            contents.unshift({ role: 'user', parts: [{ text: documentContext }] });

            // Add contextMessage to systemInstruction
            systemInstruction = contextMessage + CUSTOM_PRE_PROMPT;
            console.log("Added document context to prompt.");
        }   

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
                console.log("Writing chunk");
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
 * Endpoint for generating text with context.
 */
chatBotRouter.post('/document-chat', async (req, res) => {
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
 * Endpoint for generating schedule with context.
 */
chatBotRouter.get('/generate-schedule', async (req, res) => {
    if (!ai) return res.status(500).json({ message: 'Gemini API is not initialized. Check API_KEY.' });
    const context = (await getContext()).join('\n\n');
    const contents = [];
    if (context) {
        // Add context as a separate part or combined with the prompt
        contents.push({
            text: generateSchedulePrompt(context)
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL, // Using chat model for document AI tasks
            contents: contents,
            // System instruction for document AI can be embedded in prompt or config if specific
            // For general Q&A/summarization, the chat model works well.
        });
        res.json({ text: response.text.replace("```json", "").replace("```", "") });
    } catch (error) {
        console.error('Error in /api/schedule/generate:', error);
        res.status(500).json({ message: 'Failed to generate schedule from Gemini API.', error: error.message });
    }
});


/**
 * Endpoint for optimizing schedule with context.
 */
chatBotRouter.post('/optimize-schedule', async (req, res) => {
    if (!ai) return res.status(500).json({ message: 'Gemini API is not initialized. Check API_KEY.' });
    const context = (await getContext()).join('\n\n');
    const { prompt, schedule } = req.body;
    const contents = []
    if (context) {
        // Add context as a separate part or combined with the prompt
        contents.push({
            text: optimizeSchedulePrompt(context, schedule, prompt)
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL, // Using chat model for document AI tasks
            contents: contents,
            // System instruction for document AI can be embedded in prompt or config if specific
            // For general Q&A/summarization, the chat model works well.
        });
        res.json({ text: response.text.replace("```json", "").replace("```", "") });
    } catch (error) {
        console.error('Error in /api/schedule/optimize:', error);
        res.status(500).json({ message: 'Failed to optimize schedule from Gemini API.', error: error.message });
    }
});

export default chatBotRouter;
