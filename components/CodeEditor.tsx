import React, { useRef, useEffect, useLayoutEffect, forwardRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import * as Diff from 'diff';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  onSelectionChange?: (selection: { text: string; startLine: number; endLine: number } | null) => void;
  language?: string;
  height?: string;
  readonly?: boolean;
  modifiedCode?: string;
  showDiff?: boolean;
  onAcceptChanges?: () => void;
  mergedDiffMode?: boolean;
}

interface EditorRefType {
  selectLines: (startLine: number, endLine: number) => void;
  getEditor: () => editor.IStandaloneCodeEditor | null;
}

const CodeEditor = forwardRef<EditorRefType, CodeEditorProps>(({
  code,
  onChange,
  onSelectionChange,
  language = 'javascript',
  height = '500px',
  readonly = false,
  modifiedCode,
  showDiff = false,
  onAcceptChanges,
  mergedDiffMode = false,
}, ref) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [diffStats, setDiffStats] = useState<{added: number, removed: number}>({ added: 0, removed: 0 });
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Merged diff view logic
  let mergedCode = code;
  let mergedLineMeta: { type: 'added' | 'removed' | 'unchanged', text: string }[] = [];
  if (showDiff && mergedDiffMode) {
    // Compute merged diff
    const diffResult = Diff.diffLines((modifiedCode ?? ''), (code ?? ''));
    mergedCode = '';
    mergedLineMeta = [];
    diffResult.forEach(part => {
      const lines = part.value.split('\n');
      // Remove trailing empty line from split
      if (lines[lines.length - 1] === '') lines.pop();
      lines.forEach(line => {
        if (part.added) {
          mergedCode += line + '\n';
          mergedLineMeta.push({ type: 'added', text: line });
        } else if (part.removed) {
          // Ghost line for removed
          mergedCode += line + '\n';
          mergedLineMeta.push({ type: 'removed', text: line });
        } else {
          mergedCode += line + '\n';
          mergedLineMeta.push({ type: 'unchanged', text: line });
        }
      });
    });
    // Remove trailing newline
    if (mergedCode.endsWith('\n')) mergedCode = mergedCode.slice(0, -1);
  }

  // Callback function for when the Monaco editor is mounted
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();

    // Define the decoration styles for additions and deletions
    monaco.editor.defineTheme('cursor-diff-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#121212',
      }
    });
    
    monaco.editor.setTheme('cursor-diff-theme');

    // Add listener for selection changes if the callback is provided
    if (onSelectionChange) {
      editor.onDidChangeCursorSelection((e) => {
        const selection = editor.getSelection();
        
        if (selection && !selection.isEmpty()) {
          const model = editor.getModel();
          if (model) {
            const selectedText = model.getValueInRange(selection);
            const startLine = selection.startLineNumber;
            const endLine = selection.endLineNumber;
            
            onSelectionChange({
              text: selectedText,
              startLine,
              endLine,
            });
          }
        } else {
          // No selection
          onSelectionChange(null);
        }
      });
    }
  };

  // Configure editor options
  const options: editor.IStandaloneEditorConstructionOptions = {
    selectOnLineNumbers: true,
    roundedSelection: true,
    readOnly: true === (showDiff && mergedDiffMode) ? true : readonly,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: {
      enabled: true,
    },
    lineNumbers: 'on',
    wordWrap: 'on',
    folding: true,
    fontSize: 14,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all',
  };

  // Improved diff highlighting with both line and character level diffs
  useLayoutEffect(() => {
    if (!showDiff || !editorRef.current || !monacoRef.current) return;
    // If mergedDiffMode, use mergedLineMeta for decorations
    if (showDiff && mergedDiffMode && mergedLineMeta.length > 0) {
      setTimeout(() => {
        const decorations: editor.IModelDeltaDecoration[] = [];
        const monaco = monacoRef.current;
        const editor = editorRef.current;
        if (!monaco || !editor) return;
        const model = editor.getModel();
        if (!model) return;
        mergedLineMeta.forEach((meta, idx) => {
          if (meta.type === 'added') {
            decorations.push({
              range: new monaco.Range(idx + 1, 1, idx + 1, 1),
              options: {
                isWholeLine: true,
                className: 'editor-diff-added',
                hoverMessage: { value: 'Added' },
              },
            });
          } else if (meta.type === 'removed') {
            decorations.push({
              range: new monaco.Range(idx + 1, 1, idx + 1, 1),
              options: {
                isWholeLine: true,
                className: 'editor-diff-removed',
                hoverMessage: { value: 'Removed' },
              },
            });
          }
        });
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
      }, 0);
      return;
    }
    
    console.log('Diff detection running with:', {
      originalLength: code.length,
      modifiedLength: modifiedCode?.length || 0,
      areIdentical: code.trim() === modifiedCode?.trim()
    });
    
    // FORCE DIFFERENT CODE CHECK - If we have both code and modified code, show the diff regardless
    if (code && modifiedCode) {
      const codeLines = code.split('\n');
      const modifiedLines = modifiedCode.split('\n');
      
      console.log('Line-by-line comparison:');
      for (let i = 0; i < Math.min(codeLines.length, modifiedLines.length); i++) {
        if (codeLines[i] !== modifiedLines[i]) {
          console.log(`Difference at line ${i+1}:`, {
            original: codeLines[i],
            modified: modifiedLines[i]
          });
        }
      }
    }
    
    const decorations: editor.IModelDeltaDecoration[] = [];
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const model = editor.getModel();
    
    if (!model) return;

    let addedLines = 0;
    let removedLines = 0;
    
    // First use line-level diff to identify changed lines
    const diffResult = Diff.diffLines(code ?? '', modifiedCode ?? '');
    console.log('Diff result:', diffResult);
    
    let hasAnyChanges = false;
    let lineOffset = 0;
    
    diffResult.forEach(part => {
      const lines = part.value.split('\n');
      const lineCount = lines.length - (lines[lines.length - 1] === '' ? 1 : 0);
      
      if (part.added) {
        hasAnyChanges = true;
        addedLines += lineCount;
        console.log('Added lines detected:', lineCount, 'Preview:', part.value.substring(0, 50));
        // Highlight additions in green with stronger background
        for (let i = 0; i < lineCount; i++) {
          const lineNumber = lineOffset + i + 1;
          decorations.push({
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
              isWholeLine: true,
              linesDecorationsClassName: 'editor-diff-added-gutter',
              className: 'editor-diff-added',
              hoverMessage: { value: 'Added' },
              glyphMarginClassName: 'editor-diff-added-glyph'
            }
          });
        }
      } else if (part.removed) {
        hasAnyChanges = true;
        removedLines += lineCount;
        console.log('Removed lines detected:', lineCount, 'Preview:', part.value.substring(0, 50));
        // For removed lines, we'll show them as comments in the current view
        // This helps visualize what was removed
        if (lineCount > 0 && lineOffset < model.getLineCount()) {
          decorations.push({
            range: new monaco.Range(lineOffset + 1, 1, lineOffset + 1, 1),
            options: {
              isWholeLine: false,
              before: {
                content: '/* REMOVED:\n' + part.value + '\n*/',
                inlineClassName: 'editor-diff-removed-inline'
              }
            }
          });
        }
      }
      
      if (!part.added) {
        lineOffset += lineCount;
      }
    });
    
    // For character-level changes within unchanged or modified lines
    if (hasAnyChanges) {
      // Try to find matching lines and highlight specific character changes
      const origLines = code.split('\n');
      const modLines = modifiedCode?.split('\n') || [];
      
      console.log('Looking for character-level changes between lines');
      
      // Find similar lines that may have character-level changes
      modLines.forEach((line, modLineIdx) => {
        // Skip empty lines
        if (!line.trim()) return;
        
        // Try to find closest matching line in original
        for (let i = Math.max(0, modLineIdx - 3); i <= Math.min(origLines.length - 1, modLineIdx + 3); i++) {
          const origLine = origLines[i];
          
          // If lines are similar but not identical
          if (origLine && line !== origLine && 
              (origLine.length > 10 && line.length > 10) && 
              (origLine.substring(0, 5) === line.substring(0, 5) || 
               origLine.substring(origLine.length - 5) === line.substring(line.length - 5))) {
            
            console.log('Found similar lines:', {i, modLineIdx, origLine: origLine.substring(0, 30), line: line.substring(0, 30)});
            
            // Do character diff
            const charDiff = Diff.diffChars(origLine, line);
            let colOffset = 0;
            
            charDiff.forEach(part => {
              if (part.added) {
                console.log('Character diff found:', part.value);
                // Highlight character-level additions
                decorations.push({
                  range: new monaco.Range(
                    modLineIdx + 1, 
                    colOffset + 1, 
                    modLineIdx + 1, 
                    colOffset + part.value.length + 1
                  ),
                  options: {
                    inlineClassName: 'editor-diff-char-added',
                  }
                });
              }
              
              if (!part.removed) {
                colOffset += part.value.length;
              }
            });
            
            break; // Found a matching line, no need to continue
          }
        }
      });
    }
    
    // Apply decorations to the editor
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
    
    // Update state with diff statistics
    setDiffStats({ added: addedLines, removed: removedLines });
    setHasChanges(hasAnyChanges);
    console.log('Diff stats:', { addedLines, removedLines, hasAnyChanges });
    
  }, [showDiff, mergedDiffMode, mergedCode]);

  // Method to programmatically select text between lines
  const selectLines = (startLine: number, endLine: number) => {
    if (editorRef.current && editorRef.current.getModel() && monacoRef.current) {
      const model = editorRef.current.getModel()!;
      const startPos = { lineNumber: startLine, column: 1 };
      const endPos = { lineNumber: endLine, column: model.getLineMaxColumn(endLine) };
      
      editorRef.current.setSelection(new monacoRef.current.Range(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column
      ));
      
      editorRef.current.revealRangeInCenter({
        startLineNumber: startPos.lineNumber, 
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column
      });
    }
  };

  // Expose methods to parent via ref
  useEffect(() => {
    if (ref) {
      // Use type assertion to handle the ref properly
      (ref as React.MutableRefObject<EditorRefType>).current = {
        selectLines,
        getEditor: () => editorRef.current,
      };
    }
  }, [ref]);

  return (
    <div className="flex flex-col rounded-md overflow-hidden border border-gray-700">
      {showDiff && onAcceptChanges && (
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
          <div className="text-sm flex items-center">
            <span className="font-medium mr-3">
              {showDiff ? "Showing: Modified Code" : "Showing: Original Code"}
            </span>
            {hasChanges ? (
              <>
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span className="text-green-400 mr-4">Added ({diffStats.added} lines)</span>
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span className="text-red-400">Removed ({diffStats.removed} lines)</span>
              </>
            ) : (
              <span className="text-yellow-400">No changes detected or very minor changes</span>
            )}
          </div>
          <button 
            onClick={() => {
              console.log('Accept Changes clicked from CodeEditor');
              console.log('Current code length:', code.length);
              console.log('Modified code length:', modifiedCode?.length || 0);
              if (onAcceptChanges) {
                onAcceptChanges();
              }
            }}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
            disabled={!hasChanges}
          >
            Accept Changes
          </button>
        </div>
      )}
      <Editor
        height={height}
        language={language}
        value={showDiff && mergedDiffMode && mergedCode !== code ? mergedCode : code}
        options={options}
        onChange={showDiff && mergedDiffMode ? undefined : onChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        className="monaco-editor"
      />
    </div>
  );
});

export default CodeEditor; 