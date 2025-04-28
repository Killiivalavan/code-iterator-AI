import React, { useEffect, useState, useRef } from 'react';
import { DiffEditor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';

interface DiffViewProps {
  originalCode: string;
  modifiedCode: string;
  language?: string;
  height?: string;
  onAcceptChanges?: () => void;
}

const DiffView: React.FC<DiffViewProps> = ({
  originalCode,
  modifiedCode,
  language = 'javascript',
  height = '500px',
  onAcceptChanges
}) => {
  const [renderSideBySide, setRenderSideBySide] = useState<boolean>(true);
  const [changeCount, setChangeCount] = useState<{ added: number; removed: number; changed: number }>({ 
    added: 0, 
    removed: 0,
    changed: 0 
  });
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  
  // Define options for the diff editor
  const options: editor.IDiffEditorConstructionOptions = {
    readOnly: true,
    renderSideBySide: renderSideBySide,
    minimap: { enabled: false },
    lineNumbers: 'on',
    wordWrap: 'on',
    fontSize: 14,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all',
    originalEditable: false,
    ignoreTrimWhitespace: false, // Show whitespace differences
    renderIndicators: true, // Show indicators for changes
    renderOverviewRuler: true, // Show overview ruler
    diffWordWrap: 'on',
    diffAlgorithm: 'advanced', // Use advanced diff algorithm for better results
  };

  const handleEditorDidMount = (
    diffEditor: editor.IStandaloneDiffEditor,
    monaco: Monaco
  ) => {
    diffEditorRef.current = diffEditor;
    monacoRef.current = monaco;
    
    // Add custom styling to highlight the diff better
    const originalModel = diffEditor.getOriginalEditor().getModel();
    const modifiedModel = diffEditor.getModifiedEditor().getModel();
    
    if (originalModel && modifiedModel) {
      // Set editor options
      diffEditor.updateOptions({
        renderSideBySide: renderSideBySide,
      });
      
      // Analyze and count changes
      setTimeout(() => {
        const diffChanges = diffEditor.getLineChanges();
        if (diffChanges) {
          let added = 0;
          let removed = 0;
          let changed = 0;
          
          diffChanges.forEach(change => {
            // Count original model deletions
            if (change.originalEndLineNumber > 0) {
              const deletedLines = change.originalEndLineNumber - change.originalStartLineNumber + 1;
              removed += deletedLines;
            }
            
            // Count modified model additions
            if (change.modifiedEndLineNumber > 0) {
              const addedLines = change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;
              added += addedLines;
            }
            
            // Count changes (lines that were modified)
            if (change.originalEndLineNumber > 0 && change.modifiedEndLineNumber > 0) {
              changed += Math.min(
                change.originalEndLineNumber - change.originalStartLineNumber + 1,
                change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1
              );
            }
          });
          
          setChangeCount({ added, removed, changed });
        }
      }, 500); // Small delay to ensure the diff is computed
    }
  };

  // Toggle between side-by-side and inline diff
  const toggleDiffView = () => {
    setRenderSideBySide(!renderSideBySide);
    if (diffEditorRef.current) {
      diffEditorRef.current.updateOptions({
        renderSideBySide: !renderSideBySide,
      });
    }
  };

  // Navigate to next/previous change
  const navigateChanges = (direction: 'next' | 'prev') => {
    if (diffEditorRef.current) {
      const nav = diffEditorRef.current.getOriginalEditor().getAction(
        direction === 'next' ? 'editor.action.diffReview.next' : 'editor.action.diffReview.prev'
      );
      if (nav) {
        nav.run();
      }
    }
  };

  // Normalize whitespace to prevent unnecessary diff highlighting
  const normalizeCode = (code: string): string => {
    // Just trim the code, don't do any other normalization to ensure
    // we see all differences including whitespace
    return code.replace(/\r\n/g, '\n').trim();
  };

  // Log differences for debugging
  useEffect(() => {
    console.log("DiffView comparing codes:");
    console.log("Original (first 100 chars):", originalCode.substring(0, 100));
    console.log("Modified (first 100 chars):", modifiedCode.substring(0, 100));
    
    // Compare line by line for debugging
    const origLines = originalCode.split('\n');
    const modLines = modifiedCode.split('\n');
    
    let diffCount = 0;
    for (let i = 0; i < Math.min(origLines.length, modLines.length); i++) {
      if (origLines[i] !== modLines[i]) {
        diffCount++;
        if (diffCount <= 5) { // Limit to first 5 diffs for brevity
          console.log(`Diff at line ${i+1}:`, {
            orig: origLines[i],
            mod: modLines[i]
          });
        }
      }
    }
    console.log(`Total diff lines: ${diffCount}`);
  }, [originalCode, modifiedCode]);

  return (
    <div className="rounded-md overflow-hidden border border-gray-700 cursor-ui">
      <div className="cursor-toolbar flex-wrap">
        <div className="text-sm text-gray-300 flex items-center flex-wrap">
          <span className="mr-4 font-medium">Diff View</span>
          <span className="mr-3 flex items-center">
            <span className="cursor-tag bg-green-600 mr-2">+{changeCount.added}</span>
            <span className="text-xs">Added</span>
          </span>
          <span className="mr-3 flex items-center">
            <span className="cursor-tag bg-red-600 mr-2">-{changeCount.removed}</span>
            <span className="text-xs">Removed</span>
          </span>
          <span className="flex items-center">
            <span className="cursor-tag bg-blue-600 mr-2">~{changeCount.changed}</span>
            <span className="text-xs">Changed</span>
          </span>
        </div>
        <div className="flex mt-2 md:mt-0 space-x-2">
          <button 
            onClick={() => navigateChanges('prev')}
            className="cursor-button"
            title="Previous change"
          >
            ← Prev
          </button>
          <button 
            onClick={() => navigateChanges('next')}
            className="cursor-button"
            title="Next change"
          >
            Next →
          </button>
          <button 
            onClick={toggleDiffView}
            className="cursor-button"
            title="Toggle diff view mode"
          >
            {renderSideBySide ? "Inline View" : "Side-by-Side View"}
          </button>
          {onAcceptChanges && (
            <button 
              onClick={() => {
                console.log('Accept Changes clicked from DiffView');
                console.log('Original code length:', originalCode.length);
                console.log('Modified code length:', modifiedCode.length);
                // First ensure we're passing the modified code correctly
                onAcceptChanges();
              }}
              className="cursor-button cursor-button-success"
              title="Accept these changes"
            >
              Accept Changes
            </button>
          )}
        </div>
      </div>
      <DiffEditor
        height={height}
        language={language}
        original={normalizeCode(originalCode)}
        modified={normalizeCode(modifiedCode)}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          ...options,
          renderSideBySide: renderSideBySide,
        }}
      />
    </div>
  );
};

export default DiffView; 