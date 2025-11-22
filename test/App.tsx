import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import ChatbotSection from './components/ChatbotSection';
import DocumentAISection from './components/DocumentAISection';
import ImageGenerationSection from './components/ImageGenerationSection';
import ImageEditingSection from './components/ImageEditingSection';
import { Feature } from './types';
import { PiChatCircleText, PiFileText, PiImageSquare, PiMagicWand } from 'react-icons/pi'; // Icons for features

// Removed AIServiceWindow interface and window.aistudio related logic
// API key management is now entirely handled by the backend.

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(Feature.CHATBOT);

  // No longer need handleApiKeySelection or its useEffect call as API keys are backend managed.
  // useEffect(() => {
  //   handleApiKeySelection();
  // }, []);

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-800">
        {/* Sidebar */}
        <aside className="w-64 bg-white p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center mb-10">
              <span className="text-3xl font-extrabold text-indigo-700">Gemini</span>
              <span className="text-xl font-bold text-gray-600 ml-2">Study Buddy</span>
            </div>
            <nav>
              <ul>
                <li className="mb-4">
                  <Link
                    to="/chatbot"
                    onClick={() => setActiveFeature(Feature.CHATBOT)}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                      activeFeature === Feature.CHATBOT
                        ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
                    }`}
                  >
                    <PiChatCircleText className="mr-3 text-xl" />
                    Chatbot
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    to="/document-ai"
                    onClick={() => setActiveFeature(Feature.DOCUMENT_AI)}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                      activeFeature === Feature.DOCUMENT_AI
                        ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
                    }`}
                  >
                    <PiFileText className="mr-3 text-xl" />
                    Document AI
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    to="/image-generation"
                    onClick={() => setActiveFeature(Feature.IMAGE_GENERATION)}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                      activeFeature === Feature.IMAGE_GENERATION
                        ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
                    }`}
                  >
                    <PiImageSquare className="mr-3 text-xl" />
                    Image Generation
                  </Link>
                </li>
                <li>
                  <Link
                    to="/image-editing"
                    onClick={() => setActiveFeature(Feature.IMAGE_EDITING)}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                      activeFeature === Feature.IMAGE_EDITING
                        ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
                    }`}
                  >
                    <PiMagicWand className="mr-3 text-xl" />
                    Image Editing
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          {/* Footer or settings can go here */}
          <div className="text-center text-sm text-gray-500">
            Powered by Gemini API (via your backend)
            {/* Removed billing info link as API key is now managed by user's backend */}
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-100 p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/chatbot" />} />
            <Route path="/chatbot" element={<ChatbotSection />} />
            <Route path="/document-ai" element={<DocumentAISection />} />
            <Route path="/image-generation" element={<ImageGenerationSection />} />
            <Route path="/image-editing" element={<ImageEditingSection />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;