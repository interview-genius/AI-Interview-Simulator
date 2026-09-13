import { useState } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  language: string;
  problemTitle: string;
  onChange: (code: string) => void;
}

export function CodeEditor({ code, language, problemTitle, onChange }: CodeEditorProps) {
  const [outputPanelOpen, setOutputPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'tests'>('console');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const handleRun = () => {
    setOutputPanelOpen(true);
    setActiveTab('console');
    setIsRunning(true);
    setOutput('Executing code in secure sandbox...\n');
    
    // Simulate backend execution delay (See Backend Dependencies artifact)
    setTimeout(() => {
      setIsRunning(false);
      setOutput(prev => prev + '\n[Error]: Backend execution sandbox not yet implemented.\nEnsure you have documented this dependency.');
    }, 1500);
  };

  const handleClear = () => {
    setOutput(null);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      border: '1px solid var(--color-border)', 
      borderRadius: 'var(--radius-lg)', 
      overflow: 'hidden',
      background: '#1E1E1E' // Monaco dark theme background
    }}>
      {/* Editor Header / Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-2) var(--space-4)',
        background: '#252526', // slightly lighter than editor
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <span style={{ color: '#ccc', fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-family-mono)' }}>{language}</span>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            style={{
              padding: 'var(--space-1) var(--space-3)',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-fg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'var(--font-family-mono)',
              opacity: isRunning ? 0.7 : 1
            }}
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Editor Main Area */}
      <div style={{ flex: 1, minHeight: '300px' }}>
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => onChange(value ?? '')}
          theme="vs-dark"
          options={{
            accessibilitySupport: 'on',
            ariaLabel: `Code editor for ${problemTitle}`,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'var(--font-family-mono)',
            padding: { top: 16 }
          }}
        />
      </div>

      {/* Output Panel Toggle */}
      <div style={{
        padding: 'var(--space-2) var(--space-4)',
        background: '#252526',
        borderTop: '1px solid #333',
        display: 'flex',
        gap: 'var(--space-4)'
      }}>
        <button 
          onClick={() => { setOutputPanelOpen(true); setActiveTab('console'); }}
          style={{ 
            background: 'transparent', 
            color: activeTab === 'console' && outputPanelOpen ? '#fff' : '#888',
            fontSize: 'var(--font-size-sm)',
            borderBottom: activeTab === 'console' && outputPanelOpen ? '2px solid var(--color-accent)' : '2px solid transparent',
            paddingBottom: '2px',
            borderRadius: 0
          }}
        >
          Console
        </button>
        <button 
          onClick={() => { setOutputPanelOpen(true); setActiveTab('tests'); }}
          style={{ 
            background: 'transparent', 
            color: activeTab === 'tests' && outputPanelOpen ? '#fff' : '#888',
            fontSize: 'var(--font-size-sm)',
            borderBottom: activeTab === 'tests' && outputPanelOpen ? '2px solid var(--color-accent)' : '2px solid transparent',
            paddingBottom: '2px',
            borderRadius: 0
          }}
        >
          Test Cases
        </button>
        
        <div style={{ flex: 1 }} />
        
        {outputPanelOpen && (
          <button 
            onClick={() => setOutputPanelOpen(false)}
            style={{ background: 'transparent', color: '#888', fontSize: 'var(--font-size-xs)' }}
          >
            Close
          </button>
        )}
      </div>

      {/* Output Panel Content */}
      {outputPanelOpen && (
        <div style={{ 
          height: '200px', 
          background: '#1E1E1E',
          color: '#ccc',
          fontFamily: 'var(--font-family-mono)',
          fontSize: 'var(--font-size-sm)',
          padding: 'var(--space-4)',
          overflowY: 'auto',
          borderTop: '1px solid #333',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {activeTab === 'console' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ color: '#888' }}>Standard Output</span>
                <button onClick={handleClear} style={{ background: 'transparent', color: '#888', fontSize: 'var(--font-size-xs)' }}>Clear</button>
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: output?.includes('Error') ? 'var(--color-error)' : '#ccc' }}>
                {output || 'No output.'}
              </pre>
            </>
          )}

          {activeTab === 'tests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <span style={{ color: '#888' }}>Test Cases</span>
              <div style={{ padding: 'var(--space-2)', background: '#2D2D2D', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600 }}>Case 1</span>
                  <span style={{ color: '#888' }}>Pending</span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Input: <code>nums = [2,7,11,15], target = 9</code></span>
                  <span>Expected: <code>[0,1]</code></span>
                </div>
              </div>
              <div style={{ padding: 'var(--space-2)', background: '#2D2D2D', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600 }}>Case 2</span>
                  <span style={{ color: '#888' }}>Pending</span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Input: <code>nums = [3,2,4], target = 6</code></span>
                  <span>Expected: <code>[1,2]</code></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
