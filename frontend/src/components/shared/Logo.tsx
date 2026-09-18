export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img 
        src="/logo.png" 
        alt="FlowState" 
        style={{ height: size, width: 'auto', objectFit: 'contain' }} 
      />
      <span style={{ 
        fontFamily: 'var(--font-family-heading)', 
        fontWeight: 700, 
        fontSize: `${size * 0.55}px`,
        letterSpacing: '-0.03em',
        color: 'var(--color-text-primary)'
      }}>
        FlowState
      </span>
    </div>
  );
}
