import type { CodingProblem } from '../../types/interview';

interface ProblemStatementPanelProps {
  problem: CodingProblem;
}

export function ProblemStatementPanel({ problem }: ProblemStatementPanelProps) {
  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return { bg: 'rgba(78, 170, 120, 0.15)', text: '#4EAA78', border: 'rgba(78, 170, 120, 0.3)' };
      case 'hard':
        return { bg: 'rgba(229, 99, 83, 0.15)', text: '#E56353', border: 'rgba(229, 99, 83, 0.3)' };
      default: // medium
        return { bg: 'rgba(229, 169, 60, 0.15)', text: '#E5A93C', border: 'rgba(229, 169, 60, 0.3)' };
    }
  };

  const diffStyle = getDifficultyColor(problem.difficulty);

  // Render problem statement with inline code highlighting for backticks
  const renderFormattedStatement = (text: string) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            style={{
              background: '#252A20',
              color: '#D8E2CE',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.88em',
              border: '1px solid #363E2F'
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <section
      aria-label="Problem statement"
      style={{
        padding: '20px 24px',
        background: '#1A1D16',
        borderRadius: '16px',
        border: '1px solid #2A3022',
        color: '#FDFCF9',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Title & Difficulty Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-heading)', fontWeight: 600, color: '#FDFCF9' }}>
          {problem.title}
        </h2>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: diffStyle.bg,
            color: diffStyle.text,
            border: `1px solid ${diffStyle.border}`
          }}
        >
          {problem.difficulty}
        </span>
      </div>

      <div style={{ height: '1px', background: '#2A3022', marginBottom: '16px' }} />

      {/* Description Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
          color: '#B6BDAD',
          fontSize: '0.95rem',
          lineHeight: 1.65,
        }}
      >
        <div style={{ marginBottom: '8px', color: '#808877', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Problem Description
        </div>
        <div style={{ whiteSpace: 'pre-line' }}>
          {renderFormattedStatement(problem.statement)}
        </div>
      </div>
    </section>
  );
}
