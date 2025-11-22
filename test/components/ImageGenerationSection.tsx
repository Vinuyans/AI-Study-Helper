import React, { useState, useEffect } from 'react';
import { ImageSize } from '../types';
import { generateImage } from '../services/geminiService';
import { DEFAULT_IMAGE_SIZE, PLACEHOLDER_IMAGE_URL, GEMINI_IMAGE_GENERATION_MODEL } from '../constants';
import { PiImageSquare, PiPlusCircleFill, PiWarningCircleFill } from 'react-icons/pi';

interface ImageGenerationSectionProps {
  // Removed onApiKeySelect prop as API key is now backend managed
}

// Removed AIServiceWindow interface and window.aistudio related logic
// declare let window: AIServiceWindow;

const ImageGenerationSection: React.FC<ImageGenerationSectionProps> = ({ /* removed onApiKeySelect */ }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageSize, setImageSize] = useState<ImageSize>(DEFAULT_IMAGE_SIZE);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Removed apiKeyMissing state as API key is now backend managed
  // const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  // Removed checkApiKey function and its useEffect call
  // const checkApiKey = async () => { ... }
  // useEffect(() => { checkApiKey(); }, []);

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() === '') {
      setError('Please enter a prompt to generate an image.');
      return;
    }
    setLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    // No longer need to check apiKeyMissing on the frontend
    // if (apiKeyMissing) {
    //   setError('A paid API key is required for high-quality image generation. Please select one.');
    //   setLoading(false);
    //   return;
    // }

    try {
      const urls = await generateImage(prompt, imageSize);
      if (urls && urls.length > 0) {
        setGeneratedImageUrl(urls[0]);
      } else {
        setError('No image was generated. Please try a different prompt.');
      }
    } catch (err: any) {
      console.error('Error generating image:', err);
      // Adjusted error message to reflect backend interaction
      setError(`Failed to generate image (via backend): ${err.message || 'Unknown error'}. Please ensure your backend is running and configured correctly with a valid Gemini API key.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <PiImageSquare className="mr-3 text-red-600" /> Image Generation
      </h2>

      {error && (
        <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <PiWarningCircleFill className="mr-2 text-xl" />
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Removed API key warning and selection UI */}
      {/* {apiKeyMissing && (
        <div role="alert" className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between">
          <span className="block sm:inline">
            <strong className="font-bold">API Key Required!</strong> For high-quality image generation using `{GEMINI_IMAGE_GENERATION_MODEL}`, please select your API key. This model requires a paid GCP project.
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="ml-2 text-yellow-800 underline hover:text-yellow-900">
              Learn more about billing.
            </a>
          </span>
          <button
            onClick={onApiKeySelect}
            className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200"
          >
            Select API Key
          </button>
        </div>
      )} */}

      <form onSubmit={handleGenerateImage} className="mb-6 border-b border-gray-200 pb-6">
        <label htmlFor="prompt-image-gen" className="block text-sm font-medium text-gray-700 mb-2">
          Image Prompt
        </label>
        <textarea
          id="prompt-image-gen"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 mb-4 resize-y"
          placeholder="Describe the image you want to generate (e.g., 'A futuristic city skyline at sunset with flying cars')."
          disabled={loading}
          aria-label="Image generation prompt"
        ></textarea>

        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-medium text-gray-700">Image Size:</label>
          <div className="flex space-x-2">
            {Object.values(ImageSize).map((size) => (
              <label key={size} className="inline-flex items-center">
                <input
                  type="radio"
                  name="imageSize"
                  value={size}
                  checked={imageSize === size}
                  onChange={() => setImageSize(size)}
                  className="form-radio text-red-600 focus:ring-red-500"
                  disabled={loading}
                />
                <span className="ml-2 text-gray-700">{size}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-red-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          disabled={loading || prompt.trim() === ''} // Removed apiKeyMissing from disabled prop
          aria-label="Generate image"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="dot-pulse mr-2 dot-pulse-red"></div>
              Generating...
            </div>
          ) : (
            <>
              <PiPlusCircleFill className="mr-2 text-xl" /> Generate Image
            </>
          )}
        </button>
      </form>

      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Generated Image</h3>
        <div className="w-full max-w-lg h-80 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative shadow-inner">
          {generatedImageUrl ? (
            <img
              src={generatedImageUrl}
              alt="Generated by AI"
              className="object-contain w-full h-full"
              aria-live="polite"
            />
          ) : (
            <img
              src={PLACEHOLDER_IMAGE_URL}
              alt="Placeholder"
              className="object-cover w-full h-full opacity-60"
              aria-hidden="true"
            />
          )}
          {!generatedImageUrl && !loading && (
            <p className="absolute text-gray-500 text-center">
              Your generated image will appear here.
            </p>
          )}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-10">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-white" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .dot-pulse-red {
          background-color: #dc2626; /* Red-600 equivalent */
          color: #dc2626;
          box-shadow: -10px 0 0 0 #dc2626, 10px 0 0 0 #dc2626;
          animation: dotPulseRed 1.5s ease-in-out infinite;
        }
        .dot-pulse-red::before, .dot-pulse-red::after {
          background-color: #dc2626;
          color: #dc2626;
        }
        .dot-pulse-red::before {
          box-shadow: -10px 0 0 0 #dc2626;
          animation: dotPulseBeforeRed 1.5s ease-in-out infinite;
        }
        .dot-pulse-red::after {
          box-shadow: 10px 0 0 0 #dc2626;
          animation: dotPulseAfterRed 1.5s ease-in-out infinite;
        }
        @keyframes dotPulseRed {
          0% { box-shadow: -10px 0 0 0 #dc2626, 10px 0 0 0 #dc2626; }
          25% { box-shadow: -10px 0 0 0 #dc2626, 10px 0 0 0 #dc2626; }
          50% { box-shadow: -10px 0 0 0 #dc2626, 10px 0 0 0 #dc2626; transform: scale(1.2); }
          75% { box-shadow: -10px 0 0 0 #dc2626, 10px 0 0 0 #dc2626; }
          100% { box-shadow: -10px 0 0 0 #dc2626, 10px 0 0 0 #dc2626; }
        }
        @keyframes dotPulseBeforeRed {
          0% { box-shadow: -10px 0 0 0 #dc2626; }
          25% { box-shadow: -10px 0 0 0 #dc2626; transform: scale(1.2); }
          50% { box-shadow: -10px 0 0 0 #dc2626; }
          75% { box-shadow: -10px 0 0 0 #dc2626; }
          100% { box-shadow: -10px 0 0 0 #dc2626; }
        }
        @keyframes dotPulseAfterRed {
          0% { box-shadow: 10px 0 0 0 #dc2626; }
          25% { box-shadow: 10px 0 0 0 #dc2626; }
          50% { box-shadow: 10px 0 0 0 #dc2626; }
          75% { box-shadow: 10px 0 0 0 #dc2626; transform: scale(1.2); }
          100% { box-shadow: 10px 0 0 0 #dc2626; }
        }
        .spinner-border {
          display: inline-block;
          width: 2rem;
          height: 2rem;
          vertical-align: -0.125em;
          border: 0.25em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          -webkit-animation: .75s linear infinite spinner-border;
          animation: .75s linear infinite spinner-border;
        }
        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
};

export default ImageGenerationSection;