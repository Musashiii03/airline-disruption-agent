import { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatWindow } from '../components/Chat/ChatWindow';
import { MessageInput } from '../components/Chat/MessageInput';
import { CasePanel } from '../components/Case/CasePanel';

const DEMO_PROMPTS = [
  {
    title: 'Priya - Cancellation',
    message: 'My flight SK-204 was cancelled and I want a full refund.',
    description: 'SK4821X - Cancelled flight scenario',
  },
  {
    title: 'Arvind - Delay',
    message: 'My flight SK-118 is delayed by 4 hours and I need assistance.',
    description: 'TR1190B - Delay scenario',
  },
  {
    title: 'Meher - Higher Fare',
    message: 'My flight SK-305 is delayed by 6 hours. I need a higher-fare flight. The fare difference is ₹2,000.',
    description: 'WL7742 - Escalation scenario',
  },
];

export const SupportPage = () => {
  const chat = useChat();
  const [casePanelOpen, setCasePanelOpen] = useState(true);
  const [errorDismissed, setErrorDismissed] = useState(false);

  const handleDemoClick = (message: string) => {
    setErrorDismissed(false);
    chat.sendMessage(message);
  };

  const hasConversation = chat.conversationId !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">✈️ Airline Customer Support</h1>
              <p className="text-blue-100 mt-1">Resolution agent for flight disruptions</p>
            </div>
            {hasConversation && (
              <button
                onClick={chat.resetConversation}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                New Conversation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {chat.error && !errorDismissed && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 mx-4 mt-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm mt-1">{chat.error}</p>
            </div>
            <button
              onClick={() => setErrorDismissed(true)}
              className="text-red-600 hover:text-red-900 text-xl"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!hasConversation ? (
          // Welcome Screen
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">How can we help you today?</h2>
              <p className="text-gray-600 mb-8">Select a demo scenario or start typing your issue below</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DEMO_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.title}
                    onClick={() => handleDemoClick(prompt.message)}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
                    aria-label={`${prompt.title}: ${prompt.description}`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{prompt.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{prompt.description}</p>
                    <p className="text-xs text-blue-600 font-medium">Click to start →</p>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-gray-600 mb-4">Or type your own message:</p>
              </div>
            </div>

            {/* Message Input for Welcome */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <MessageInput onSend={chat.sendMessage} disabled={chat.loading} />
            </div>
          </div>
        ) : (
          // Chat Layout
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Area - 2 columns on desktop, full width on mobile */}
            <div className="lg:col-span-2 flex flex-col h-[calc(100vh-200px)]">
              <ChatWindow messages={chat.messages} loading={chat.loading} />
              <MessageInput onSend={chat.sendMessage} disabled={chat.loading} />
            </div>

            {/* Case Panel - 1 column on desktop, collapsible on mobile */}
            <div className="lg:col-span-1">
              {/* Mobile Toggle Button */}
              <button
                onClick={() => setCasePanelOpen(!casePanelOpen)}
                className="w-full lg:hidden mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                {casePanelOpen ? 'Hide' : 'Show'} Case Information
              </button>

              {/* Case Panel */}
              <div className={casePanelOpen ? 'block' : 'hidden lg:block'}>
                <CasePanel caseSnapshot={chat.caseSnapshot} onClose={() => setCasePanelOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
