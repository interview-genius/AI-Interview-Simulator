import type { CodingProblem } from '../../types/interview';

interface ProblemStatementPanelProps {
  problem: CodingProblem;
}

export function ProblemStatementPanel({ problem }: ProblemStatementPanelProps) {
  return (
    <section
      aria-label="Problem statement"
      style={{
        padding: 'var(--space-4)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: 'var(--font-size-lg)' }}>
        {problem.title}{' '}
        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: 'var(--font-size-sm)' }}>
          ({problem.difficulty})
        </span>
      </h2>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{problem.statement}</p>
    </section>
  );
}
