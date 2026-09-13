import type { CodingProblem } from '../../types/interview';

interface ProblemStatementPanelProps {
  problem: CodingProblem;
}

export function ProblemStatementPanel({ problem }: ProblemStatementPanelProps) {
  return (
    <section
      aria-label="Problem statement"
      style={{
        padding: '24px',
        background: '#1A1D16',
        borderRadius: '16px',
        border: '1px solid #2A3022',
        color: '#FDFCF9'
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-heading)', fontWeight: 600 }}>
        {problem.title}{' '}
        <span style={{ color: '#808877', fontWeight: 400, fontSize: '0.9rem' }}>
          ({problem.difficulty})
        </span>
      </h2>
      <p style={{ margin: 0, color: '#808877', lineHeight: 1.6 }}>{problem.statement}</p>
    </section>
  );
}
