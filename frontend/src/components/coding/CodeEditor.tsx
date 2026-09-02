import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  language: string;
  problemTitle: string;
  onChange: (code: string) => void;
}

/** Thin wrapper around @monaco-editor/react. accessibilitySupport: 'on' is
 *  Monaco's documented fix for its default Tab-key focus-trap behavior
 *  with screen readers -- without it, keyboard/AT users can get stuck
 *  inside the editor. */
export function CodeEditor({ code, language, problemTitle, onChange }: CodeEditorProps) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <Editor
        height="420px"
        language={language}
        value={code}
        onChange={(value) => onChange(value ?? '')}
        theme="vs-dark"
        options={{
          accessibilitySupport: 'on',
          ariaLabel: `Code editor for ${problemTitle}`,
          minimap: { enabled: false },
          fontSize: 14,
        }}
      />
    </div>
  );
}
