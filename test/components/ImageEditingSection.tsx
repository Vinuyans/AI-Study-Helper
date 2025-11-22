import React, { useState, useEffect } from 'react';
import { editImage, getBase64 } from '../services/geminiService';
import { PLACEHOLDER_IMAGE_URL, SUPPORTED_IMAGE_MIME_TYPES, GEMINI_IMAGE_EDITING_MODEL } from '../constants';
import { PiMagicWand, PiUploadSimple, PiSparkleFill, PiWarningCircleFill } from 'react-icons/pi';

interface ImageEditingSectionProps {
  // Removed onApiKeySelect prop as API key is now backend managed
}

// Removed AIServiceWindow interface and window.aistudio related logic
// declare let window: AIServiceWindow;

const ImageEditingSection: React.FC<ImageEditingSectionProps> = ({ /* removed onApiKeySelect */ }) => {
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Removed apiKeyMissing state as API key is now backend managed
  // const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  // Removed checkApiKey function and its useEffect call
  // const checkApiKey = async () => { ... }
  // useEffect(() => { checkApiKey(); }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!SUPPORTED_IMAGE_MIME_TYPES.includes(file.type)) {
        setError(`Unsupported file type: ${file.type}. Please upload a PNG, JPEG, or WebP image.`);
        setBaseImageFile(null);
        setBaseImageUrl(null);
        return;
      }
      setBaseImageFile(file);
      setBaseImageUrl(URL.createObjectURL(file));
      setEditedImageUrl(null); // Clear previous edited image
    }
  };

  const handleEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseImageFile) {
      setError('Please upload an image to edit.');
      return;
    }
    if (editPrompt.trim() === '') {
      setError('Please enter a prompt describing the edits.');
      return;
    }

    setLoading(true);
    setError(null);
    setEditedImageUrl(null);

    // No longer need to check apiKeyMissing on the frontend
    // if (apiKeyMissing) {
    //   setError('An API key might be required for image editing. Please select one if prompted.');
    //   setLoading(false);
    //   return;
    // }

    try {
      const base64Image = await getBase64(baseImageFile);
      const mimeType = baseImageFile.type;

      const urls = await editImage(base64Image, mimeType, editPrompt);
      if (urls && urls.length > 0) {
        setEditedImageUrl(urls[0]);
      } else {
        setError('No edited image was returned. Please try a different prompt.');
      }
    } catch (err: any) {
      console.error('Error editing image:', err);
      // Adjusted error message to reflect backend interaction
      setError(`Failed to edit image (via backend): ${err.message || 'Unknown error'}. Please ensure your backend is running and configured correctly with a valid Gemini API key.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <PiMagicWand className="mr-3 text-purple-600" /> Image Editing
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
            <strong className="font-bold">API Key Notice:</strong> An API key may be required for image editing using `{GEMINI_IMAGE_EDITING_MODEL}`. Please ensure you have one selected.
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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 border-b border-gray-200 pb-6">
        {/* Original Image Upload */}
        <div>
          <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Upload Base Image (.png, .jpeg, .webp)
          </label>
          <input
            id="image-upload"
            type="file"
            accept=".png,.jpeg,.jpg,.webp"
            onChange={handleImageUpload}
            className="hidden"
            aria-describedby="image-upload-help"
          />
          <button
            onClick={() => document.getElementById('image-upload')?.click()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
            disabled={loading}
          >
            <PiUploadSimple className="mr-2 -ml-1 text-lg" />
            Choose Image
          </button>
          <span id="image-upload-help" className="text-sm text-gray-500 ml-4">
            {baseImageFile ? baseImageFile.name : 'No image chosen'}
          </span>
          <div className="mt-4 w-full max-w-sm h-64 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative shadow-inner">
            {baseImageUrl ? (
              <img src={baseImageUrl} alt="Base for editing" className="object-contain w-full h-full" />
            ) : (
              <img src={PLACEHOLDER_IMAGE_URL} alt="Placeholder" className="object-cover w-full h-full opacity-60" />
            )}
            {!baseImageUrl && <p className="absolute text-gray-500 text-center">Upload your image here</p>}
          </div>
        </div>

        {/* Edited Image Display */}
        <div>
          <h3 className="block text-sm font-medium text-gray-700 mb-2">Edited Image Result</h3>
          <div className="mt-4 w-full max-w-sm h-64 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative shadow-inner">
            {editedImageUrl ? (
              <img src={editedImageUrl} alt="Edited by AI" className="object-contain w-full h-full" aria-live="polite" />
            ) : (
              <img src={PLACEHOLDER_IMAGE_URL} alt="Placeholder" className="object-cover w-full h-full opacity-60" />
            )}
            {!editedImageUrl && !loading && <p className="absolute text-gray-500 text-center">Edited image will appear here</p>}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-10">
                <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-white" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleEditImage} className="flex-1 flex flex-col">
        <label htmlFor="edit-prompt-textarea" className="block text-sm font-medium text-gray-700 mb-2">
          Edit Prompt
        </label>
        <textarea
          id="edit-prompt-textarea"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 mb-4 flex-1 resize-y"
          placeholder="Describe the edits you want (e.g., 'Add a retro filter', 'Remove the person in the background')."
          disabled={loading}
          aria-label="Image editing prompt"
        ></textarea>

        <button
          type="submit"
          className="bg-purple-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto self-end"
          disabled={loading || !baseImageFile || editPrompt.trim() === ''} // Removed apiKeyMissing from disabled prop
          aria-label="Edit image"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="dot-pulse mr-2 dot-pulse-purple"></div>
              Editing...
            </div>
          ) : (
            <>
              <PiSparkleFill className="mr-2 text-xl" /> Edit Image
            </>
          )}
        </button>
      </form>
      <style>{`
        .dot-pulse-purple {
          background-color: #9333ea; /* Purple-600 equivalent */
          color: #9333ea;
          box-shadow: -10px 0 0 0 #9333ea, 10px 0 0 0 #9333ea;
          animation: dotPulsePurple 1.5s ease-in-out infinite;
        }
        .dot-pulse-purple::before, .dot-pulse-purple::after {
          background-color: #9333ea;
          color: #9333ea;
        }
        .dot-pulse-purple::before {
          box-shadow: -10px 0 0 0 #9333ea;
          animation: dotPulseBeforePurple 1.5s ease-in-out infinite;
        }
        .dot-pulse-purple::after {
          box-shadow: 10px 0 0 0 #9333ea;
          animation: dotPulseAfterPurple 1.5s ease-in-out infinite;
        }
        @keyframes dotPulsePurple {
          0% { box-shadow: -10px 0 0 0 #9333ea, 10px 0 0 0 #9333ea; }
          25% { box-shadow: -10px 0 0 0 #9333ea, 10px 0 0 0 #9333ea; }
          50% { box-shadow: -10px 0 0 0 #9333ea, 10px 0 0 0 #9333ea; transform: scale(1.2); }
          75% { box-shadow: -10px 0 0 0 #9333ea, 10px 0 0 0 #9333ea; }
          100% { box-shadow: -10px 0 0 0 #9333ea, 10px 0 0 0 #9333ea; }
        }
        @keyframes dotPulseBeforePurple {
          0% { box-shadow: -10px 0 0 0 #9333ea; }
          25% { box-shadow: -10px 0 0 0 #9333ea; transform: scale(1.2); }
          50% { box-shadow: -10px 0 0 0 #9333ea; }
          75% { box-shadow: -10px 0 0 0 #9333ea; }
          100% { box-shadow: -10px 0 0 0 #9333ea; }
        }
        @keyframes dotPulseAfterPurple {
          0% { box-shadow: 10px 0 0 0 #9333ea; }
          25% { box-shadow: 10px 0 0 0 #9333ea; }
          50% { box-shadow: 10px 0 0 0 #9333ea; }
          75% { box-shadow: 10px 0 0 0 #9333ea; transform: scale(1.2); }
          100% { box-shadow: 10px 0 0 0 #9333ea; }
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

export default ImageEditingSection;