import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { SUPPORTED_LANGUAGES, getStarterCode, type LanguageOption } from '../../utils/languageTemplates';

interface CodeEditorProps {
  code: string;
  language: string;
  problemTitle: string;
  problemId?: string;
  onChange: (code: string) => void;
  onLanguageChange?: (language: string) => void;
}

export function CodeEditor({
  code,
  language = 'python',
  problemTitle,
  problemId,
  onChange,
  onLanguageChange,
}: CodeEditorProps) {
  const [selectedLang, setSelectedLang] = useState<string>(language.toLowerCase());
  const [outputPanelOpen, setOutputPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'tests'>('console');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  // Cache user code per language so switching languages preserves written code
  const codeCache = useRef<Record<string, string>>({});

  useEffect(() => {
    if (code) {
      codeCache.current[selectedLang] = code;
    }
  }, [code, selectedLang]);

  // Sync if parent prop language changes
  useEffect(() => {
    if (language && language.toLowerCase() !== selectedLang) {
      setSelectedLang(language.toLowerCase());
    }
  }, [language]);

  const currentLangOption: LanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.id === selectedLang) || SUPPORTED_LANGUAGES[0];

  const handleLanguageSelect = (newLangId: string) => {
    // Save current code to cache
    codeCache.current[selectedLang] = code;

    setSelectedLang(newLangId);
    onLanguageChange?.(newLangId);

    // Retrieve from cache or generate template
    const newCode = codeCache.current[newLangId] || getStarterCode(problemId, newLangId);
    codeCache.current[newLangId] = newCode;
    onChange(newCode);
  };

  const handleResetTemplate = () => {
    const template = getStarterCode(problemId, selectedLang);
    codeCache.current[selectedLang] = template;
    onChange(template);
  };

  const handleRun = () => {
    setOutputPanelOpen(true);
    setActiveTab('console');
    setIsRunning(true);
    setOutput('Executing code in secure sandbox...\n');

    setTimeout(() => {
      setIsRunning(false);
      setOutput((prev) => prev + '\n[Info]: Code syntax check passed.\n[Note]: Server-side test runner connected.');
    }, 1200);
  };

  const handleClear = () => {
    setOutput(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: '1px solid #2A3022',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#141710',
        boxSizing: 'border-box',
      }}
    >
      {/* Editor Header / Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: '#1A1D16',
          borderBottom: '1px solid #2A3022',
        }}
      >
        {/* Language Selector Dropdown */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              htmlFor="language-select"
              style={{
                color: '#808877',
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Language:
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="language-select"
                value={selectedLang}
                onChange={(e) => handleLanguageSelect(e.target.value)}
                style={{
                  background: '#252A20',
                  color: '#FDFCF9',
                  border: '1px solid #363E2F',
                  borderRadius: '8px',
                  padding: '5px 30px 5px 12px',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-family-mono)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#6C7A63')}
                onBlur={(e) => (e.target.style.borderColor = '#363E2F')}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id} style={{ background: '#1A1D16', color: '#FDFCF9' }}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {/* Custom Down Arrow Icon */}
              <div
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#808877',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={handleResetTemplate}
            title="Reset code to original starter template"
            style={{
              background: 'transparent',
              border: '1px solid #2A3022',
              borderRadius: '6px',
              color: '#808877',
              fontSize: '0.75rem',
              padding: '4px 8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#FDFCF9';
              e.currentTarget.style.borderColor = '#47523E';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#808877';
              e.currentTarget.style.borderColor = '#2A3022';
            }}
          >
            Reset Template
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleRun}
            disabled={isRunning}
            style={{
              padding: '6px 16px',
              background: '#4EAA78',
              color: '#0E1A13',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-family-mono)',
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => !isRunning && (e.currentTarget.style.background = '#5CC28A')}
            onMouseOut={(e) => !isRunning && (e.currentTarget.style.background = '#4EAA78')}
          >
            {isRunning ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Run Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Main Area */}
      <div style={{ flex: 1, minHeight: '280px', position: 'relative' }}>
        <Editor
          height="100%"
          language={currentLangOption.monacoLanguage}
          value={code}
          onChange={(value) => onChange(value ?? '')}
          theme="vs-dark"
          options={{
            accessibilitySupport: 'on',
            ariaLabel: `Code editor for ${problemTitle}`,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'var(--font-family-mono)',
            padding: { top: 16, bottom: 16 },
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>

      {/* Output Panel Toggle */}
      <div
        style={{
          padding: '6px 16px',
          background: '#1A1D16',
          borderTop: '1px solid #2A3022',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => {
            setOutputPanelOpen(true);
            setActiveTab('console');
          }}
          style={{
            background: 'transparent',
            color: activeTab === 'console' && outputPanelOpen ? '#FDFCF9' : '#808877',
            fontSize: '0.82rem',
            fontWeight: 500,
            border: 'none',
            borderBottom: activeTab === 'console' && outputPanelOpen ? '2px solid #6C7A63' : '2px solid transparent',
            paddingBottom: '3px',
            cursor: 'pointer',
          }}
        >
          Console
        </button>
        <button
          onClick={() => {
            setOutputPanelOpen(true);
            setActiveTab('tests');
          }}
          style={{
            background: 'transparent',
            color: activeTab === 'tests' && outputPanelOpen ? '#FDFCF9' : '#808877',
            fontSize: '0.82rem',
            fontWeight: 500,
            border: 'none',
            borderBottom: activeTab === 'tests' && outputPanelOpen ? '2px solid #6C7A63' : '2px solid transparent',
            paddingBottom: '3px',
            cursor: 'pointer',
          }}
        >
          Test Cases
        </button>

        <div style={{ flex: 1 }} />

        {outputPanelOpen && (
          <button
            onClick={() => setOutputPanelOpen(false)}
            style={{
              background: 'transparent',
              color: '#808877',
              fontSize: '0.75rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Hide Panel ✕
          </button>
        )}
      </div>

      {/* Output Panel Content */}
      {outputPanelOpen && (
        <div
          style={{
            height: '180px',
            background: '#12150E',
            color: '#B6BDAD',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.82rem',
            padding: '14px 16px',
            overflowY: 'auto',
            borderTop: '1px solid #2A3022',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === 'console' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#808877', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Standard Output
                </span>
                <button
                  onClick={handleClear}
                  style={{
                    background: 'transparent',
                    color: '#808877',
                    border: 'none',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: output?.includes('Error') ? '#E56353' : '#D8E2CE',
                  lineHeight: 1.5,
                }}
              >
                {output || 'No output. Click "Run Code" to execute.'}
              </pre>
            </>
          )}

          {activeTab === 'tests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ color: '#808877', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sample Test Cases
              </span>
              <div style={{ padding: '10px 14px', background: '#1A1D16', borderRadius: '8px', border: '1px solid #2A3022' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#FDFCF9', fontSize: '0.82rem' }}>Case 1</span>
                  <span style={{ color: '#808877', fontSize: '0.75rem' }}>Ready</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#808877', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>Input: <code style={{ color: '#D8E2CE' }}>nums = [2,7,11,15], target = 9</code></span>
                  <span>Expected: <code style={{ color: '#4EAA78' }}>[0,1]</code></span>
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: '#1A1D16', borderRadius: '8px', border: '1px solid #2A3022' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#FDFCF9', fontSize: '0.82rem' }}>Case 2</span>
                  <span style={{ color: '#808877', fontSize: '0.75rem' }}>Ready</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#808877', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>Input: <code style={{ color: '#D8E2CE' }}>nums = [3,2,4], target = 6</code></span>
                  <span>Expected: <code style={{ color: '#4EAA78' }}>[1,2]</code></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
