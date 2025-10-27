import React, { useState, useEffect, useCallback } from 'react';

interface LiveEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

const LiveEditor: React.FC<LiveEditorProps> = ({ initialContent, onContentChange }) => {
  const [content, setContent] = useState(initialContent);

  const memoizedOnContentChange = useCallback(onContentChange, []);

  useEffect(() => {
    memoizedOnContentChange(content);
  }, [content, memoizedOnContentChange]);

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };
  
  return (
    <div className="w-full h-full bg-gray-900 font-mono text-sm">
      <textarea
        value={content}
        onChange={handleContentChange}
        className="w-full h-full p-4 bg-transparent text-gray-200 resize-none border-0 focus:outline-none focus:ring-0"
        spellCheck="false"
      />
    </div>
  );
};

export default LiveEditor;
