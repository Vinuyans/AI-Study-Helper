import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PiFileText, PiUploadSimple, PiMagicWand, PiBookOpen } from 'react-icons/pi';
import { generateTextWithContext } from '@/services/geminiServices';

const DocumentAISection = () => {
  const [documents, setDocuments] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    setError(null);
    if (event.target.files) {
      const newDocuments = [];
      for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];
        if (file.type === 'text/plain' || file.type === 'application/pdf') { // Basic check, PDF parsing needs external lib
          try {
            const fileContent = await file.text(); // Read as text, won't parse PDF
            newDocuments.push({
              id: uuidv4(),
              name: file.name,
              content: fileContent,
            });
          } catch (e) {
            console.error(`Error reading file ${file.name}:`, e);
            setError(`Could not read file ${file.name}. Only text files are fully supported for content extraction.`);
          }
        } else {
          setError(`Unsupported file type: ${file.type}. Please upload text or PDF (text content only).`);
        }
      }
      setDocuments((prev) => [...prev, ...newDocuments]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (prompt.trim() === '' || documents.length === 0) {
      setError('Please upload documents and enter a prompt.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse('');

    const combinedContext = documents.map(doc => `Document "${doc.name}":\n${doc.content}`).join('\n\n---\n\n');

    try {
      const generatedResponse = await generateTextWithContext(prompt, combinedContext);
      setResponse(generatedResponse);
    } catch (err) {
      console.error('Error generating document AI response:', err);
      setError('Failed to generate response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <PiFileText className="mr-3 text-emerald-600" /> Document AI
      </h2>

      {error && (
        <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="mb-6 border-b border-gray-200 pb-6">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Upload Study Documents (.txt, .pdf for text content)
        </label>
        <div className="flex items-center space-x-4">
          <input
            id="file-upload"
            type="file"
            accept=".txt,.pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
            aria-describedby="file-upload-help"
          />
          <button
            onClick={() => document.getElementById('file-upload')?.click()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
          >
            <PiUploadSimple className="mr-2 -ml-1 text-lg" />
            Choose Files
          </button>
          <span id="file-upload-help" className="text-sm text-gray-500">
            {documents.length > 0 ? `${documents.length} file(s) uploaded.` : 'No files chosen'}
          </span>
        </div>
        {documents.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200 max-h-32 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Documents:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {documents.map((doc) => (
                <li key={doc.id}>{doc.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <form onSubmit={handleGenerate} className="flex-1 flex flex-col">
        <label htmlFor="prompt-textarea" className="block text-sm font-medium text-gray-700 mb-2">
          Your Prompt (e.g., "Summarize these documents" or "Create a study schedule for these topics")
        </label>
        <textarea
          id="prompt-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 mb-4 flex-1 resize-y"
          placeholder="Type your query here..."
          disabled={loading}
          aria-label="Document AI prompt"
        ></textarea>

        <button
          type="submit"
          className="bg-emerald-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto self-end"
          disabled={loading || documents.length === 0 || prompt.trim() === ''}
          aria-label="Generate response"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="dot-pulse mr-2 dot-pulse-emerald"></div>
              Generating...
            </div>
          ) : (
            <>
              <PiMagicWand className="mr-2 text-xl" /> Generate Response
            </>
          )}
        </button>
      </form>

      {response && (
        <div className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-lg shadow-inner overflow-y-auto max-h-96">
          <h3 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center">
            <PiBookOpen className="mr-2 text-2xl" /> AI Response
          </h3>
          <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
        </div>
      )}
      {/* Removed jsx prop from style tag */}
      <style>{`
        .dot-pulse-emerald {
          background-color: #059669; /* Emerald-600 equivalent */
          color: #059669;
          box-shadow: -10px 0 0 0 #059669, 10px 0 0 0 #059669;
          animation: dotPulseEmerald 1.5s ease-in-out infinite;
        }
        .dot-pulse-emerald::before, .dot-pulse-emerald::after {
          background-color: #059669;
          color: #059669;
        }
        .dot-pulse-emerald::before {
          box-shadow: -10px 0 0 0 #059669;
          animation: dotPulseBeforeEmerald 1.5s ease-in-out infinite;
        }
        .dot-pulse-emerald::after {
          box-shadow: 10px 0 0 0 #059669;
          animation: dotPulseAfterEmerald 1.5s ease-in-out infinite;
        }
        @keyframes dotPulseEmerald {
          0% { box-shadow: -10px 0 0 0 #059669, 10px 0 0 0 #059669; }
          25% { box-shadow: -10px 0 0 0 #059669, 10px 0 0 0 #059669; }
          50% { box-shadow: -10px 0 0 0 #059669, 10px 0 0 0 #059669; transform: scale(1.2); }
          75% { box-shadow: -10px 0 0 0 #059669, 10px 0 0 0 #059669; }
          100% { box-shadow: -10px 0 0 0 #059669, 10px 0 0 0 #059669; }
        }
        @keyframes dotPulseBeforeEmerald {
          0% { box-shadow: -10px 0 0 0 #059669; }
          25% { box-shadow: -10px 0 0 0 #059669; transform: scale(1.2); }
          50% { box-shadow: -10px 0 0 0 #059669; }
          75% { box-shadow: -10px 0 0 0 #059669; }
          100% { box-shadow: -10px 0 0 0 #059669; }
        }
        @keyframes dotPulseAfterEmerald {
          0% { box-shadow: 10px 0 0 0 #059669; }
          25% { box-shadow: 10px 0 0 0 #059669; }
          50% { box-shadow: 10px 0 0 0 #059669; }
          75% { box-shadow: 10px 0 0 0 #059669; transform: scale(1.2); }
          100% { box-shadow: 10px 0 0 0 #059669; }
        }
      `}</style>
    </div>
  );
};

export default DocumentAISection;