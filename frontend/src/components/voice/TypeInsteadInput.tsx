import { useState, type FormEvent } from 'react';

interface TypeInsteadInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
}

/** Always mounted, always Tab-reachable -- not a hidden/collapsed
 *  affordance. This is a real accessibility path (deaf/mute/speech-
 *  impaired candidates, noisy/quiet-required environments), not a
 *  fallback bolted on after the voice-first design: it feeds the exact
 *  same processing step as a finalized voice utterance. */
export function TypeInsteadInput({ onSubmit, disabled }: TypeInsteadInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <label htmlFor="type-instead" className="sr-only">
        Type your answer instead of speaking
      </label>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: '#151811',
          border: `1px solid ${isFocused ? '#6C7A63' : '#2A3022'}`,
          boxShadow: isFocused ? '0 0 0 3px rgba(108, 122, 99, 0.2)' : 'none',
          borderRadius: '10px',
          padding: '2px 12px',
          transition: 'all 0.2s ease',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#808877"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '8px', flexShrink: 0 }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <input
          id="type-instead"
          type="text"
          value={value}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setValue(e.target.value)}
          placeholder={disabled ? 'Interviewer is speaking or processing...' : 'Type your answer instead and press Enter...'}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FDFCF9',
            fontSize: '0.9rem',
            padding: '10px 0',
            fontFamily: 'inherit',
          }}
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 18px',
          borderRadius: '10px',
          border: 'none',
          background: disabled || !value.trim() ? '#252A20' : '#6C7A63',
          color: disabled || !value.trim() ? '#66705D' : '#FDFCF9',
          fontWeight: 600,
          fontSize: '0.88rem',
          cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
      >
        <span>Send</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
}
