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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: 'var(--space-2)' }}
    >
      <label htmlFor="type-instead" className="sr-only">
        Type your answer instead of speaking
      </label>
      <input
        id="type-instead"
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Or type your answer instead…"
        style={{
          flex: 1,
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        style={{
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-raised)',
          color: 'var(--color-text-primary)',
          cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        Send
      </button>
    </form>
  );
}
