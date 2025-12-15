import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PiPaperPlaneRightFill, PiSparkleFill, PiChatCircleText } from 'react-icons/pi';
import { sendMessageStream } from '@/services/geminiServices';

const ChatbotSection = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const [uploadedDocumentContext, setUploadedDocumentContext] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || loading) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      parts: [{ text: input }],
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // The `ChatEntry` type defines `role` as 'user' | 'model', so filtering
      // for `msg.role !== 'system'` is redundant and causes a type error.
      // The backend expects 'user' or 'model' roles for chat history.
      const chatHistoryForAPI = messages.map(msg => ({
        role: msg.role,
        parts: msg.parts,
      }));

      let fullResponseText = '';
      const modelMessageId = uuidv4();
      const modelInitialMessage = {
        id: modelMessageId,
        role: 'model',
        parts: [{ text: '' }],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, modelInitialMessage]);

      // System instruction is now implicitly managed by the backend when it creates the chat session.
      const stream = sendMessageStream(input, chatHistoryForAPI);

      for await (const chunk of stream) {
        const c = chunk;
        if (c.text) {
          fullResponseText += c.text;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === modelMessageId ? { ...msg, parts: [{ text: fullResponseText }] } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.role === 'model' && msg.parts[0].text === ''
            ? { ...msg, parts: [{ text: 'Error: Could not get a response.' }] }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentContext = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/file/context-all');
      const data = await response.json();
      // data.combined_context contains all document text
      setUploadedDocumentContext(data.combined_context);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchDocumentCount = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/file/context-all');
      const data = await response.json();
      setDocumentCount(data.total_files_processed);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocumentCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocumentCount();
    fetchDocumentContext();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <PiChatCircleText className="mr-3 text-indigo-600" /> Chat with Gemini
      </h2>
      <div>
        <p className='text-gray-800'> Uploaded Documents: 
          <span className="ml-1">
            {loading ? 'Loading...' : ((documentCount === 0) ? 'None' : documentCount)}
          </span>
        </p>
      </div>
      <div className="flex-1 overflow-y-auto pr-4 mb-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <PiSparkleFill className="text-6xl text-indigo-300 mb-4" />
            <p className="text-lg">Start a conversation with your AI Study Buddy!</p>
            <p className="text-sm mt-2">Ask questions, summarize notes, or brainstorm ideas.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex mb-4 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-3/4 p-3 rounded-lg shadow-md ${
                msg.role === 'user'
                  ? 'bg-indigo-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm md:text-base whitespace-pre-wrap">{msg.parts[0].text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="max-w-3/4 p-3 rounded-lg shadow-md bg-gray-200 text-gray-800 rounded-bl-none">
              <div className="flex items-center">
                <div className="dot-pulse mr-2"></div>
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your study buddy anything..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
          disabled={loading}
          aria-label="Chat input"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || input.trim() === ''}
          aria-label="Send message"
        >
          <PiPaperPlaneRightFill className="text-xl" />
        </button>
      </form>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d4d4d4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        .dot-pulse {
          position: relative;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #667eea; /* Indigo-500 equivalent */
          color: #667eea;
          box-shadow: -10px 0 0 0 #667eea, 10px 0 0 0 #667eea;
          animation: dotPulse 1.5s ease-in-out infinite;
        }
        .dot-pulse::before, .dot-pulse::after {
          content: '';
          display: inline-block;
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #667eea;
          color: #667eea;
        }
        .dot-pulse::before {
          box-shadow: -10px 0 0 0 #667eea;
          animation: dotPulseBefore 1.5s ease-in-out infinite;
        }
        .dot-pulse::after {
          box-shadow: 10px 0 0 0 #667eea;
          animation: dotPulseAfter 1.5s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0% { box-shadow: -10px 0 0 0 #667eea, 10px 0 0 0 #667eea; }
          25% { box-shadow: -10px 0 0 0 #667eea, 10px 0 0 0 #667eea; }
          50% { box-shadow: -10px 0 0 0 #667eea, 10px 0 0 0 #667eea; transform: scale(1.2); }
          75% { box-shadow: -10px 0 0 0 #667eea, 10px 0 0 0 #667eea; }
          100% { box-shadow: -10px 0 0 0 #667eea, 10px 0 0 0 #667eea; }
        }
        @keyframes dotPulseBefore {
          0% { box-shadow: -10px 0 0 0 #667eea; }
          25% { box-shadow: -10px 0 0 0 #667eea; transform: scale(1.2); }
          50% { box-shadow: -10px 0 0 0 #667eea; }
          75% { box-shadow: -10px 0 0 0 #667eea; }
          100% { box-shadow: -10px 0 0 0 #667eea; }
        }
        @keyframes dotPulseAfter {
          0% { box-shadow: 10px 0 0 0 #667eea; }
          25% { box-shadow: 10px 0 0 0 #667eea; }
          50% { box-shadow: 10px 0 0 0 #667eea; }
          75% { box-shadow: 10px 0 0 0 #667eea; transform: scale(1.2); }
          100% { box-shadow: 10px 0 0 0 #667eea; }
        }
      `}</style>
    </div>
  );
};

export default ChatbotSection;
