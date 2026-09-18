export const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <div className="bg-gray-200 rounded-full p-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      <span className="text-sm text-gray-600">Agent is processing...</span>
    </div>
  );
};
