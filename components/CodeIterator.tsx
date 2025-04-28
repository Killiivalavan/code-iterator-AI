import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import CodeEditor from './CodeEditor';
import DiffView from './DiffView';

interface ApiResponse {
  modified_code: string;
  explanation: string;
}

interface Selection {
  text: string;
  startLine: number;
  endLine: number;
}

interface EditorRefType {
  selectLines: (startLine: number, endLine: number) => void;
  getEditor: () => any;
}

// Language options for the dropdown
const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
];

const CodeIterator: React.FC = () => {
  const [code, setCode] = useState<string>('// Enter your code here');
  const [instruction, setInstruction] = useState<string>('');
  const [modifiedCode, setModifiedCode] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [selectedCode, setSelectedCode] = useState<Selection | null>(null);
  const [useGroq, setUseGroq] = useState<boolean>(true); // Default to using Groq API
  const [viewOriginalCode, setViewOriginalCode] = useState<boolean>(false); // For toggling between original and modified code
  const [showDiffHighlighting, setShowDiffHighlighting] = useState<boolean>(true); // For enabling/disabling diff highlighting
  const [showSideBySideDiff, setShowSideBySideDiff] = useState<boolean>(false); // For showing side-by-side diff
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Use ref to store the modified code for reliability
  const modifiedCodeRef = useRef<string>('');
  
  // Update the ref whenever modifiedCode changes
  useEffect(() => {
    modifiedCodeRef.current = modifiedCode;
  }, [modifiedCode]);
  
  const editorRef = useRef<EditorRefType>(null);

  // Handle selection change in the editor
  const handleSelectionChange = (selection: Selection | null) => {
    setSelectedCode(selection);
    
    // Optionally update the instruction to mention the selected code
    if (selection && selection.text.trim().length > 0) {
      if (instruction === '') {
        setInstruction(`Improve the selected code (lines ${selection.startLine}-${selection.endLine})`);
      }
    }
  };

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle submission to API
  const handleSubmit = async () => {
    // Validate input
    if (!code.trim()) {
      setError('Please enter some code to modify');
      return;
    }

    if (!instruction.trim()) {
      setError('Please provide an instruction');
      return;
    }

    setError('');
    setLoading(true);
    setShowDiff(false);
    setIsSuccess(false);

    try {
      console.log('Sending request to API...');
      showNotification('Processing your code with AI...', 'info');
      
      // Determine what code to send based on selection
      const codeToSend = selectedCode ? selectedCode.text : code;
      
      console.log('Request payload:', {
        code: codeToSend.substring(0, 100) + '...',
        instruction,
        language,
        selection: selectedCode ? {
          start_line: selectedCode.startLine,
          end_line: selectedCode.endLine
        } : undefined,
        use_groq: useGroq
      });
      
      const response = await axios.post<ApiResponse>('http://localhost:8000/iterate-code', {
        code: codeToSend,
        instruction,
        language,
        full_context: selectedCode ? code : undefined, // Send full code as context when using selection
        selection: selectedCode ? {
          start_line: selectedCode.startLine,
          end_line: selectedCode.endLine
        } : undefined,
        use_groq: useGroq // Send the user's preference for using Groq API
      });

      const { modified_code, explanation: resp_explanation } = response.data;
      
      console.log('API Response:', {
        modified_code_length: modified_code.length,
        explanation_length: resp_explanation.length,
        modified_code_preview: modified_code.substring(0, 100) + '...',
        code_changed: modified_code.trim() !== codeToSend.trim()
      });
      
      // VERY IMPORTANT: Save exact modified code from API for comparison
      const originalModifiedCode = modified_code;
      
      // If we had a selection, we need to replace just that part in the full code
      let finalModifiedCode = modified_code;
      if (selectedCode) {
        const lines = code.split('\n');
        const beforeSelection = lines.slice(0, selectedCode.startLine - 1).join('\n');
        const afterSelection = lines.slice(selectedCode.endLine).join('\n');
        
        // Build the new full code by replacing just the selected part
        finalModifiedCode = beforeSelection + 
          (beforeSelection ? '\n' : '') + 
          modified_code + 
          (afterSelection ? '\n' : '') + 
          afterSelection;
      }
      
      console.log('Final code comparison:', {
        original_length: code.length,
        modified_length: finalModifiedCode.length,
        are_identical: finalModifiedCode.trim() === code.trim()
      });
      
      // FORCE DIFFERENT CODE: Always show diff and set success if API returned any code
      if (originalModifiedCode.length > 10) {
        setIsSuccess(true);
        
        // Store the modified code to be displayed
        console.log("Setting modifiedCode with length:", finalModifiedCode.length);
        
        // Important: Store the plain finalModifiedCode, not a reference to code
        const independentModifiedCode = String(finalModifiedCode);
        setModifiedCode(independentModifiedCode);
        
        setExplanation(resp_explanation);
        setShowDiff(true);
        showNotification('Code modification received!', 'success');
      } else {
        console.warn('API returned empty or too short code');
        setError('The AI returned invalid code. Please try a different instruction.');
        showNotification('Error: Invalid code received', 'error');
        setShowDiff(false);
        setIsSuccess(false);
      }
    } catch (err: any) {
      console.error('Error calling API:', err);
      if (err.response?.data?.detail) {
        setError(`Failed to process the code: ${err.response.data.detail}`);
      } else {
        setError('Failed to process the code. Please try again.');
      }
      showNotification('Error processing your code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Integrate the modified code into the editor
  const handleIntegrateCode = () => {
    // Use modifiedCodeRef as fallback in case state has been lost
    const currentModifiedCode = modifiedCode || modifiedCodeRef.current;
    
    console.log("Integration requested - Switching from original to modified code");
    console.log("Original code (first 50 chars):", code.substring(0, 50));
    console.log("Modified code (first 50 chars):", currentModifiedCode.substring(0, 50));
    
    if (currentModifiedCode && currentModifiedCode !== code) {
      // Force a brand new string creation to avoid any reference issues
      const safeModifiedCode = String(currentModifiedCode);
      
      // Directly set the code state to the modified code
      setCode(safeModifiedCode);
      
      // Important: reset the modified code and hide diff to prevent confusion
      setModifiedCode('');
      setShowDiff(false);
      setViewOriginalCode(false);
      
      // Clear any errors
      setError('');
      showNotification('Changes successfully applied!', 'success');
      
      // If we had a selection, select it again in the editor after integration
      if (selectedCode && editorRef.current) {
        // Use setTimeout to ensure this happens after the editor updates
        setTimeout(() => {
          editorRef.current?.selectLines(selectedCode.startLine, selectedCode.endLine);
        }, 100);
      }
    } else {
      setError('No changes to integrate.');
      showNotification('No changes to apply.', 'error');
    }
  };

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    // Optionally, you could provide language-specific starter code here
    if (e.target.value === 'python') {
      setCode('# Enter your Python code here\n\n');
    } else if (e.target.value === 'javascript') {
      setCode('// Enter your JavaScript code here\n\n');
    }
    // Clear any selection when changing languages
    setSelectedCode(null);
  };

  // Toggle between Groq and Ollama
  const handleModelToggle = () => {
    setUseGroq(!useGroq);
    showNotification(`Switched to ${!useGroq ? 'Groq' : 'Ollama'} AI model`, 'info');
  };

  // Toggle between original and modified code
  const toggleCodeView = () => {
    setViewOriginalCode(!viewOriginalCode);
  };

  // Toggle diff highlighting
  const toggleDiffHighlighting = () => {
    setShowDiffHighlighting(!showDiffHighlighting);
  };

  // Toggle side-by-side diff view
  const toggleSideBySideDiff = () => {
    setShowSideBySideDiff(!showSideBySideDiff);
  };

  // Format the explanation for display
  const formatExplanation = (text: string): string => {
    if (!text) return '';
    
    // If it starts with "Failed to parse" then it's an error message
    if (text.startsWith('Failed to parse')) {
      // Extract just the explanation part if possible
      const mainExplanation = text.split('Raw response:')[0].trim();
      return mainExplanation;
    }
    
    return text;
  };

  // Parse explanation to highlight code segments or specific changes
  const renderExplanation = () => {
    if (!explanation) return null;
    
    const formattedText = formatExplanation(explanation);
    
    // Simple parser to find code/markdown elements
    const parts = formattedText.split(/(`{1,3}(.*?)`{1,3})/g);
    
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            // Code block
            const code = part.slice(3, -3);
            return (
              <pre key={index} className="bg-gray-900 p-2 rounded my-2 overflow-x-auto">
                <code>{code}</code>
              </pre>
            );
          } else if (part.startsWith('`') && part.endsWith('`')) {
            // Inline code
            const code = part.slice(1, -1);
            return <code key={index} className="bg-gray-900 px-1 rounded">{code}</code>;
          } else if (part.match(/^(\d+\.|-)/) && !part.includes('```')) {
            // List item (bullet or numbered)
            return <div key={index} className="ml-4">{part}</div>;
          } else {
            // Regular text
            return <span key={index}>{part}</span>;
          }
        })}
      </div>
    );
  };

  return (
    <div className="h-full">
      {/* Notification Toast */}
      {notification && (
        <div className={`cursor-notification ${notification.type === 'success' ? 'bg-green-800' : notification.type === 'error' ? 'bg-red-800' : 'bg-blue-800'}`}>
          {notification.message}
        </div>
      )}

      {/* New Cursor-like Layout with 2/3 - 1/3 split */}
      <div className="flex h-full min-h-0"> {/* min-h-0 is important for flex children to shrink properly */}
        {/* Left side: Code Editor Area (2/3) */}
        <div className="w-2/3 h-full flex flex-col border-r border-gray-700 min-h-0">
          <div className="cursor-toolbar justify-between">
            <div className="flex items-center">
              <h2 className="text-sm font-medium">Code Editor</h2>
              <div className="ml-4 flex items-center">
                <label htmlFor="language-select" className="mr-2 text-xs">Language:</label>
                <select
                  id="language-select"
                  value={language}
                  onChange={handleLanguageChange}
                  className="bg-editor text-white rounded-md border border-gray-700 px-2 py-1 text-xs"
                >
                  {LANGUAGE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {showDiff && isSuccess && (
              <div className="flex gap-2">
                <button
                  onClick={toggleDiffHighlighting}
                  className={`cursor-button text-xs px-2 py-1 ${showDiffHighlighting ? 'cursor-button-primary' : ''}`}
                >
                  {showDiffHighlighting ? "Hide Diff" : "Show Diff"}
                </button>
                
                <button
                  onClick={toggleSideBySideDiff}
                  className={`cursor-button text-xs px-2 py-1 ${showSideBySideDiff ? 'cursor-button-primary' : ''}`}
                >
                  {showSideBySideDiff ? "Editor View" : "Side-by-Side"}
                </button>
                
                <button
                  onClick={toggleCodeView}
                  className="cursor-button text-xs px-2 py-1"
                >
                  {viewOriginalCode ? "Show Modified" : "Show Original"}
                </button>
              </div>
            )}
          </div>
          
          {/* Main Code Editor - Takes up full height */}
          <div className="flex-1 min-h-0 flex flex-col">
            {showDiff && isSuccess && showSideBySideDiff ? (
              <DiffView 
                originalCode={code}
                modifiedCode={modifiedCode}
                language={language}
                height="100%"
                onAcceptChanges={() => {
                  handleIntegrateCode();
                }}
              />
            ) : (
              <div className="flex-1 min-h-0">
                <CodeEditor 
                  ref={editorRef}
                  code={showDiff && isSuccess && !showSideBySideDiff ? modifiedCode : code} 
                  onChange={(value: string | undefined) => setCode(value || '')} 
                  onSelectionChange={handleSelectionChange}
                  height="calc(100vh - 120px)"
                  language={language}
                  showDiff={showDiff && isSuccess && !showSideBySideDiff}
                  modifiedCode={showDiff && isSuccess && !showSideBySideDiff ? code : undefined}
                  readonly={false}
                  mergedDiffMode={showDiff && isSuccess && !showSideBySideDiff}
                />
              </div>
            )}
          </div>
          
          {selectedCode && (
            <div className="p-2 bg-gray-700 text-xs text-white flex justify-between items-center">
              <div>
                <span className="font-semibold">Selected:</span> Lines {selectedCode.startLine}-{selectedCode.endLine}
              </div>
              <button 
                className="text-xs text-blue-300 hover:text-blue-100 cursor-button"
                onClick={() => setSelectedCode(null)}
              >
                Clear Selection
              </button>
            </div>
          )}
          
          {showDiff && isSuccess && !showSideBySideDiff && (
            <div className="p-2 bg-gray-800 border-t border-gray-700">
              <button
                onClick={handleIntegrateCode}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
              >
                Apply Changes
              </button>
            </div>
          )}
        </div>

        {/* Right side: AI Tools Panel (1/3) */}
        <div className="w-1/3 h-full flex flex-col overflow-auto bg-gray-900">
          <div className="cursor-toolbar justify-between">
            <h2 className="text-sm font-medium">AI Assistant</h2>
            
            {/* Model toggle */}
            <div className="flex items-center text-xs">
              <span className={`mr-1 ${!useGroq ? 'text-blue-400 font-medium' : 'text-gray-400'}`}>Ollama</span>
              <div 
                className={`relative inline-block w-8 h-4 transition duration-200 ease-in-out rounded-full cursor-pointer ${useGroq ? 'bg-blue-600' : 'bg-gray-600'}`}
                onClick={handleModelToggle}
              >
                <div 
                  className={`absolute top-0.5 left-0.5 w-3 h-3 transition duration-200 ease-in-out transform bg-white rounded-full ${useGroq ? 'translate-x-4' : ''}`}
                ></div>
              </div>
              <span className={`ml-1 ${useGroq ? 'text-blue-400 font-medium' : 'text-gray-400'}`}>Groq</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
            {/* Instruction area */}
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1 text-gray-300">Instructions</label>
              <textarea
                className="w-full h-32 p-2 bg-editor text-white rounded-md border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                placeholder={selectedCode 
                  ? `Describe what changes you want to make to the selected code (lines ${selectedCode.startLine}-${selectedCode.endLine})...` 
                  : "Describe what changes you want to make to the code..."}
                value={instruction}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInstruction(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs">{error}</div>
            )}

            {/* Simple Submit button */}
            <button
              className="px-4 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-xs self-center"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : "Submit"}
            </button>
            
            {/* Explanation area */}
            {explanation && (
              <div className="mt-2 flex-1 overflow-y-auto">
                <div className="text-xs font-medium mb-1 text-gray-300">AI Explanation</div>
                <div className="cursor-explanation text-sm overflow-auto max-h-[calc(100vh-380px)]">
                  {renderExplanation()}
                </div>
                
                {showDiff && isSuccess && (
                  <button 
                    onClick={handleIntegrateCode}
                    className="mt-3 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded w-full"
                  >
                    Apply Changes
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeIterator; 