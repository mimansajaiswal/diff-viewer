import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Code, Eye, EyeOff, Hash } from 'lucide-react';
use client;

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
          className="absolute left-0 top-0 bottom-0 w-10 bg-gray-100 text-gray-400 text-right pr-2 pt-2 select-none overflow-hidden"
          style={{ pointerEvents: 'none' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        className={`w-full h-40 resize-none p-2 leading-6 ${showLineNumbers ? 'pl-12' : ''}`}
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

    const linesA = processedA.split('\n');
    const linesB = processedB.split('\n');
    let diff = [];
    let unchangedCount = 0;

    for (let i = 0; i < Math.max(linesA.length, linesB.length); i++) {
      if (linesA[i] !== linesB[i]) {
        if (unchangedCount > 0) {
          diff.push({ type: 'unchanged', count: unchangedCount });
          unchangedCount = 0;
        }
        if (linesA[i] === undefined) {
          diff.push({ type: 'addition', content: linesB[i], lineNumber: i + 1 });
        } else if (linesB[i] === undefined) {
          diff.push({ type: 'deletion', content: linesA[i], lineNumber: i + 1 });
        } else {
          diff.push({ type: 'modification', contentA: linesA[i], contentB: linesB[i], lineNumber: i + 1 });
        }
      } else {
        if (showOnlyDiffs) {
          unchangedCount++;
        } else {
          diff.push({ type: 'unchanged', content: linesA[i], lineNumber: i + 1 });
        }
      }
    }

    if (unchangedCount > 0) {
      diff.push({ type: 'unchanged', count: unchangedCount });
    }

    setResult(diff);
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
      // If parsing fails, do nothing
    }
  };

  const handleTextChange = (text, setter, jsonSetter) => {
    setter(text);
    jsonSetter(isValidJson(text));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Advanced Text Comparison Tool</h1>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[
          { version: 'A', text: textA, setText: setTextA, isJson: isJsonA, setIsJson: setIsJsonA, fileInput: fileInputA },
          { version: 'B', text: textB, setText: setTextB, isJson: isJsonB, setIsJson: setIsJsonB, fileInput: fileInputB }
        ].map(({ version, text, setText, isJson, setIsJson, fileInput }) => (
          <Card key={version}>
            <CardHeader className="flex justify-between items-center">
              <span>Version {version}</span>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInput.current.click()}
                  title="Upload File"
                >
                  <Upload className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setText('')}
                  title="Clear Text"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {isJson && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => formatJson(text, setText)}
                    title="Format JSON"
                  >
                    <Code className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <input
                type="file"
                ref={fileInput}
                className="hidden"
                onChange={(e) => handleFileUpload(e, setText, setIsJson)}
              />
            </CardHeader>
            <CardContent>
              <LineNumberedTextarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value, setText, setIsJson)}
                showLineNumbers={showLineNumbers}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="mr-2">Compare by:</span>
          <Button
            onClick={() => setCompareMode('word')}
            variant={compareMode === 'word' ? 'default' : 'outline'}
          >
            Word
          </Button>
          <Button
            onClick={() => setCompareMode('char')}
            variant={compareMode === 'char' ? 'default' : 'outline'}
            className="ml-2"
          >
            Character
          </Button>
        </div>
        <div>
          <Button
            onClick={() => setShowOnlyDiffs(!showOnlyDiffs)}
            variant="outline"
            className="mr-2"
          >
            {showOnlyDiffs ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showOnlyDiffs ? 'Show All' : 'Show Diffs Only'}
          </Button>
          <Button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            variant="outline"
          >
            <Hash className="w-4 h-4 mr-2" />
            {showLineNumbers ? 'Hide Line Numbers' : 'Show Line Numbers'}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>Result</CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-mono">
            {result.map((line, index) => {
              switch (line.type) {
                case 'addition':
                  return (
                    <div key={index} className="bg-green-100 flex">
                      {showLineNumbers && <span className="text-gray-400 w-10 text-right pr-2 select-none">{line.lineNumber}</span>}
                      <span>+ {line.content}</span>
                    </div>
                  );
                case 'deletion':
                  return (
                    <div key={index} className="bg-red-100 flex">
                      {showLineNumbers && <span className="text-gray-400 w-10 text-right pr-2 select-none">{line.lineNumber}</span>}
                      <span>- {line.content}</span>
                    </div>
                  );
                case 'modification':
                  return (
                    <div key={index}>
                      <div className="bg-red-100 flex">
                        {showLineNumbers && <span className="text-gray-400 w-10 text-right pr-2 select-none">{line.lineNumber}</span>}
                        <span>- {line.contentA}</span>
                      </div>
                      <div className="bg-green-100 flex">
                        {showLineNumbers && <span className="text-gray-400 w-10 text-right pr-2 select-none">{line.lineNumber}</span>}
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
                      {showLineNumbers && <span className="text-gray-400 w-10 text-right pr-2 select-none">{line.lineNumber}</span>}
                      <span>{line.content}</span>
                    </div>
                  );
                case 'error':
                  return <div key={index} className="text-red-500">{line.content}</div>;
                default:
                  return null;
              }
            })}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default TextDiffTool;
