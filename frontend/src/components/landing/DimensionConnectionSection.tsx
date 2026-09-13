import { useState } from 'react';

export function DimensionConnectionSection() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const dimensions = {
    technical: { title: 'Technical', diff: '64 → 78', desc: 'Your system design explanations became more structured across your last 4 interviews.', x: '20%', y: '20%' },
    communication: { title: 'Communication', diff: '72 → 85', desc: 'Fewer filler words and more precise answers under pressure.', x: '70%', y: '30%' },
    problem_solving: { title: 'Problem Solving', diff: '50 → 70', desc: 'You now proactively explore edge cases before coding.', x: '30%', y: '60%' },
    presence: { title: 'Presence', diff: '80 → 88', desc: 'Maintained strong eye contact and poise during difficult follow-ups.', x: '75%', y: '65%' }
  };

  return (
    <section style={{ 
      padding: 'var(--space-24) var(--space-8)',
      background: 'var(--color-bg)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
          <h2 style={{ fontSize: 'var(--font-size-3xl)', fontFamily: 'var(--font-family-heading)' }}>
            What you actually improve.
          </h2>
          <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: 'var(--space-4) auto 0' }}>
            The tree isn't just decorative. It represents actual multidimensional progress.
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Central Mature Tree Graphic */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
             <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="0.5">
               <path d="M12 22V4" strokeWidth="1" stroke="var(--color-secondary-accent)" />
               <path d="M12 16c-5-5-7-2-9 3" />
               <path d="M12 12c5-5 7-2 9 3" />
               <path d="M12 8c-4-4-5-1-7 3" />
               <path d="M12 6c4-3 5-1 6 2" />
               <path d="M12 2c6-1 8 2 10 5" />
             </svg>
          </div>

          {/* Interactive Nodes */}
          {Object.entries(dimensions).map(([key, data]) => {
            const isHovered = hoveredNode === key;
            const isFaded = hoveredNode !== null && hoveredNode !== key;

            return (
              <div 
                key={key}
                onMouseEnter={() => setHoveredNode(key)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  position: 'absolute',
                  left: data.x,
                  top: data.y,
                  opacity: isFaded ? 0.3 : 1,
                  transition: 'all 0.3s ease',
                  zIndex: isHovered ? 10 : 1
                }}
              >
                {/* Visual Node */}
                <div style={{ 
                  width: '24px', height: '24px', 
                  background: 'var(--color-accent)', 
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: isHovered ? '0 0 0 8px rgba(108,122,99,0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }} />

                {/* Info Card (Visible on hover or default) */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '40px',
                  transform: 'translateY(-50%)',
                  background: 'var(--color-surface)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  width: '280px',
                  opacity: isHovered ? 1 : 0,
                  pointerEvents: isHovered ? 'auto' : 'none',
                  transition: 'opacity 0.3s ease',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)' }}>{data.title}</span>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 600, fontFamily: 'var(--font-family-mono)' }}>{data.diff}</span>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {data.desc}
                  </p>
                </div>

                {/* Default Label when not hovered */}
                {!isHovered && (
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    left: '40px',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none'
                  }}>
                    {data.title}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
