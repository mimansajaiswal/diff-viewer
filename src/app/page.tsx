'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Code, Eye, EyeOff, Hash, AlignLeft, SplitSquareVertical, Type } from 'lucide-react';
import * as diff from 'diff';

const LineNumberedTextarea = ({ value, onChange, showLineNumbers }) => {
  const textareaRef = useRef(null);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    const updateLineCount = () => {
      if (textareaRef.current) {
        setLineCount(value.split('\n').length);
      }
    };
    updateLineCount();
  }, [value]);

  return (
    <div className="relative border rounded-md">
      {showLineNumbers && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-8 sm:w-10 bg-gray-100 text-gray-400 text-right pr-1 sm:pr-2 pt-2 select-none overflow-hidden"
          style={{ pointerEvents: 'none' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="leading-6 text-xs sm:text-sm">{i + 1}</div>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        className={`w-full h-32 sm:h-40 resize-none p-1 sm:p-2 leading-6 text-sm sm:text-base ${showLineNumbers ? 'pl-10 sm:pl-12' : ''}`}
        style={{ fontFamily: 'monospace' }}
      />
    </div>
  );
};

const TextDiffTool = () => {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [result, setResult] = useState([]);
  const [compareMode, setCompareMode] = useState('word');
  const [isJsonA, setIsJsonA] = useState(false);
  const [isJsonB, setIsJsonB] = useState(false);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const fileInputA = useRef(null);
  const fileInputB = useRef(null);

  const isValidJson = (text) => {
    try {
      JSON.parse(text);
      return true;
    } catch (e) {
      return false;
    }
  };

  const compareTexts = () => {
    let processedA = textA;
    let processedB = textB;

    if (isJsonA && isJsonB) {
      try {
        processedA = JSON.stringify(JSON.parse(textA), null, 2);
        processedB = JSON.stringify(JSON.parse(textB), null, 2);
      } catch (error) {
        setResult([{ type: 'error', content: 'Invalid JSON input' }]);
        return;
      }
    }

    let diffResult = [];
    let unchangedCount = 0;

    if (compareMode === 'line') {
      const linesA = processedA.split('\n');
      const linesB = processedB.split('\n');

      for (let i = 0; i < Math.max(linesA.length, linesB.length); i++) {
        if (linesA[i] !== linesB[i]) {
          if (unchangedCount > 0) {
            diffResult.push({ type: 'unchanged', count: unchangedCount });
            unchangedCount = 0;
          }
          if (linesA[i] === undefined) {
            diffResult.push({ type: 'addition', content: linesB[i], lineNumber: i + 1 });
          } else if (linesB[i] === undefined) {
            diffResult.push({ type: 'deletion', content: linesA[i], lineNumber: i + 1 });
          } else {
            diffResult.push({ type: 'modification', contentA: linesA[i], contentB: linesB[i], lineNumber: i + 1 });
          }
        } else {
          if (showOnlyDiffs) {
            unchangedCount++;
          } else {
            diffResult.push({ type: 'unchanged', content: linesA[i], lineNumber: i + 1 });
          }
        }
      }
    } else {
      const linesA = processedA.split('\n');
      const linesB = processedB.split('\n');

      for (let i = 0; i < Math.max(linesA.length, linesB.length); i++) {
        const lineA = linesA[i] || '';
        const lineB = linesB[i] || '';

        if (lineA !== lineB) {
          if (unchangedCount > 0) {
            diffResult.push({ type: 'unchanged', count: unchangedCount });
            unchangedCount = 0;
          }
          let lineDiff;
          if (compareMode === 'word') {
            lineDiff = diff.diffWords(lineA, lineB);
          } else {
            lineDiff = diff.diffChars(lineA, lineB);
          }
          diffResult.push({ type: 'diff', content: lineDiff, lineNumber: i + 1 });
        } else if (showOnlyDiffs) {
          unchangedCount++;
        } else {
          diffResult.push({ type: 'unchanged', content: lineA, lineNumber: i + 1 });
        }
      }
    }

    if (unchangedCount > 0) {
      diffResult.push({ type: 'unchanged', count: unchangedCount });
    }

    if (showOnlyDiffs) {
      diffResult = diffResult.filter(item => item.type !== 'unchanged' || 'count' in item);
    }

    setResult(diffResult);
  };

  useEffect(() => {
    compareTexts();
  }, [textA, textB, compareMode, showOnlyDiffs]);

  const handleFileUpload = (e, setter, jsonSetter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setter(content);
        jsonSetter(isValidJson(content));
      };
      reader.readAsText(file);
    }
  };

  const formatJson = (text, setter) => {
    try {
      setter(JSON.stringify(JSON.parse(text), null, 2));
    } catch (error) {
    }
  };

  const handleTextChange = (text, setter, jsonSetter) => {
    setter(text);
    jsonSetter(isValidJson(text));
  };

  return (
    <div className="p-2 sm:p-4 max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Advanced Text Comparison Tool</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {[
          { version: 'v1', text: textA, setText: setTextA, isJson: isJsonA, setIsJson: setIsJsonA, fileInput: fileInputA },
          { version: 'v2', text: textB, setText: setTextB, isJson: isJsonB, setIsJson: setIsJsonB, fileInput: fileInputB }
        ].map(({ version, text, setText, isJson, setIsJson, fileInput }) => (
          <Card key={version} className="relative">
            <div className="absolute top-2 left-2 font-bold text-sm bg-gray-200 px-2 py-1 rounded">{version}</div>
            <div className="absolute top-1 right-1 flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInput.current.click()}
                title="Upload File"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setText('')}
                title="Clear Text"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {isJson && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatJson(text, setText)}
                  title="Format JSON"
                >
                  <Code className="w-4 h-4" />
                </Button>
              )}
            </div>
            <CardContent className="pt-10">
              <LineNumberedTextarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value, setText, setIsJson)}
                showLineNumbers={showLineNumbers}
              />
            </CardContent>
            <input
              type="file"
              ref={fileInput}
              className="hidden"
              onChange={(e) => handleFileUpload(e, setText, setIsJson)}
            />
          </Card>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center">
          <span className="mr-2 text-sm sm:text-base">Compare by:</span>
          <Button
            onClick={() => setCompareMode('char')}
            variant={compareMode === 'char' ? 'default' : 'outline'}
            size="sm"
          >
            <SplitSquareVertical className="w-4 h-4 mr-1" />
            Character
          </Button>
          <Button
            onClick={() => setCompareMode('word')}
            variant={compareMode === 'word' ? 'default' : 'outline'}
            className="ml-2"
            size="sm"
          >
            <Type className="w-4 h-4 mr-1" />
            Word
          </Button>
          <Button
            onClick={() => setCompareMode('line')}
            variant={compareMode === 'line' ? 'default' : 'outline'}
            className="ml-2"
            size="sm"
          >
            <AlignLeft className="w-4 h-4 mr-1" />
            Line
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowOnlyDiffs(!showOnlyDiffs)}
            variant="outline"
            size="sm"
          >
            {showOnlyDiffs ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
            <span className="hidden sm:inline">{showOnlyDiffs ? 'Show All' : 'Show Diffs Only'}</span>
          </Button>
          <Button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            variant="outline"
            size="sm"
          >
            <Hash className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{showLineNumbers ? 'Hide Line Numbers' : 'Show Line Numbers'}</span>
          </Button>
        </div>
      </div>
      <Card className="relative">
        <div className="absolute top-2 left-2 font-bold text-sm bg-gray-200 px-2 py-1 rounded">Result</div>
        <CardContent className="pt-10">
          <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm">
            {result.length === 0 ? (
              <div className="text-gray-500">No differences found</div>
            ) : (
              result.map((line, index) => {
                switch (line.type) {
                  case 'addition':
                    return (
                      <div key={index} className="bg-green-100 flex">
                        {showLineNumbers && <span className="text-gray-400 w-8 sm:w-10 text-right pr-1 sm:pr-2 select-none">{line.lineNumber}</span>}
                        <span>+ {line.content}</span>
                      </div>
                    );
                  case 'deletion':
                    return (
                      <div key={index} className="bg-red-100 flex">
                        {showLineNumbers && <span className="text-gray-400 w-8 sm:w-10 text-right pr-1 sm:pr-2 select-none">{line.lineNumber}</span>}
                        <span>- {line.content}</span>
                      </div>
                    );
                  case 'modification':
                    return (
                      <div key={index}>
                        <div className="bg-red-100 flex">
                          {showLineNumbers && <span className="text-gray-400 w-8 sm:w-10 text-right pr-1 sm:pr-2 select-none">{line.lineNumber}</span>}
                          <span>- {line.contentA}</span>
                        </div>
                        <div className="bg-green-100 flex">
                          {showLineNumbers && <span className="text-gray-400 w-8 sm:w-10 text-right pr-1 sm:pr-2 select-none">{line.lineNumber}</span>}
                          <span>+ {line.contentB}</span>
                        </div>
                      </div>
                    );
                  case 'unchanged':
                    if ('count' in line) {
                      return <div key={index} className="text-gray-500">... {line.count} unchanged lines ...</div>;
                    }
                    return (
                      <div key={index} className="flex">
                        {showLineNumbers && <span className="text-gray-400 w-8 sm:w-10 text-right pr-1 sm:pr-2 select-none">{line.lineNumber}</span>}
                        <span>{line.content}</span>
                      </div>
                    );
                  case 'diff':
                    return (
                      <div key={index} className="flex">
                        {showLineNumbers && <span className="text-gray-400 w-8 sm:w-10 text-right pr-1 sm:pr-2 select-none">{line.lineNumber}</span>}
                        <span>
                          {line.content.map((part, i) => (
                            <span
                              key={i}
                              className={
                                part.added
                                  ? 'bg-green-200'
                                  : part.removed
                                  ? 'bg-red-200'
                                  : ''
                              }
                            >
                              {part.value}
                            </span>
                          ))}
                        </span>
                      </div>
                    );
                  case 'error':
                    return <div key={index} className="text-red-500">{line.content}</div>;
                  default:
                    return null;
                }
              })
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default TextDiffTool;
