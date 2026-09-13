import React from 'react';

export type TreeStage = 
  | 'Seed' 
  | 'Little Sapling' 
  | 'Bigger Sapling' 
  | 'Plant' 
  | 'Plant with flowers' 
  | 'Plant with fruits' 
  | 'Mature Tree';

interface TreeVisualizationProps {
  stage: TreeStage;
  style?: React.CSSProperties;
}

export function TreeVisualization({ stage, style }: TreeVisualizationProps) {
  const trees: Record<TreeStage, JSX.Element> = {
    'Seed': (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        {/* Ground lines */}
        <path d="M60 160 L140 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M45 160 L50 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M150 160 L155 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        {/* Dirt mound */}
        <path d="M70 160 Q100 145 130 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        {/* Seed/tiny sprout */}
        <path d="M95 155 Q100 145 105 155 Z" fill="#88C462" stroke="#3E3E3E" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    ),
    'Little Sapling': (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M60 160 L140 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 160 Q100 145 130 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 150 Q105 120 95 90" stroke="#3E3E3E" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M95 110 Q80 100 85 125 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M95 90 Q80 60 110 50 Q120 70 95 90 Z" fill="#88C462" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        {/* Cute face */}
        <circle cx="102" cy="70" r="2" fill="#3E3E3E" />
        <circle cx="112" cy="73" r="2" fill="#3E3E3E" />
        <path d="M105 75 Q107 78 109 75" stroke="#3E3E3E" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
    'Bigger Sapling': (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M60 160 L140 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 160 Q100 140 130 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 145 Q110 110 95 75" stroke="#3E3E3E" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M105 130 Q125 125 115 145 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 100 Q80 90 85 115 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M97 85 Q125 75 115 95 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M95 75 Q75 55 95 40 Q115 55 95 75 Z" fill="#88C462" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        {/* Cute face */}
        <circle cx="90" cy="58" r="2.5" fill="#3E3E3E" />
        <circle cx="100" cy="58" r="2.5" fill="#3E3E3E" />
        <path d="M93 62 L95 65 L97 62" stroke="#3E3E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    'Plant': (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M50 160 L150 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 160 Q100 135 140 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 145 Q110 90 100 55" stroke="#3E3E3E" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M102 120 Q130 110 120 135 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M98 100 Q70 90 80 115 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M103 80 Q135 70 120 95 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M97 65 Q65 55 80 80 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        {/* Crown - basic plant leaves top */}
        <circle cx="100" cy="48" r="16" fill="#88C462" stroke="#3E3E3E" strokeWidth="4" />
        {/* Cute face */}
        <circle cx="95" cy="46" r="2.5" fill="#3E3E3E" />
        <circle cx="105" cy="46" r="2.5" fill="#3E3E3E" />
        <path d="M98 51 Q100 54 102 51" stroke="#3E3E3E" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Blush */}
        <circle cx="90" cy="51" r="3" fill="#FF8BA7" opacity="0.4" />
        <circle cx="110" cy="51" r="3" fill="#FF8BA7" opacity="0.4" />
      </svg>
    ),
    'Plant with flowers': (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M50 160 L150 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 160 Q100 135 140 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 145 Q110 90 100 55" stroke="#3E3E3E" strokeWidth="6" strokeLinecap="round" fill="none" />
        
        {/* Leaves */}
        <path d="M102 120 Q130 110 120 135 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M98 100 Q70 90 80 115 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M103 80 Q135 70 120 95 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M97 65 Q65 55 80 80 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        
        {/* Crown base */}
        <circle cx="100" cy="48" r="18" fill="#88C462" stroke="#3E3E3E" strokeWidth="4" />
        
        {/* Flowers! One by one concept, so there are several distinct flowers */}
        <circle cx="85" cy="40" r="4" fill="#FF8BA7" stroke="#3E3E3E" strokeWidth="1.5" />
        <circle cx="115" cy="55" r="4" fill="#FF8BA7" stroke="#3E3E3E" strokeWidth="1.5" />
        <circle cx="100" cy="30" r="4.5" fill="#FF8BA7" stroke="#3E3E3E" strokeWidth="1.5" />
        <circle cx="75" cy="70" r="3.5" fill="#FF8BA7" stroke="#3E3E3E" strokeWidth="1.5" />
        
        {/* Cute face */}
        <circle cx="95" cy="48" r="2.5" fill="#3E3E3E" />
        <circle cx="105" cy="48" r="2.5" fill="#3E3E3E" />
        <path d="M98 53 Q100 56 102 53" stroke="#3E3E3E" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
    'Plant with fruits': (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M50 160 L150 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 160 Q100 135 140 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 145 Q110 90 100 55" stroke="#3E3E3E" strokeWidth="6" strokeLinecap="round" fill="none" />
        
        {/* Leaves */}
        <path d="M102 120 Q130 110 120 135 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M98 100 Q70 90 80 115 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M103 80 Q135 70 120 95 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M97 65 Q65 55 80 80 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        
        {/* Crown base */}
        <circle cx="100" cy="48" r="20" fill="#88C462" stroke="#3E3E3E" strokeWidth="4" />
        
        {/* Fruits (Apples/Oranges style) */}
        <circle cx="85" cy="40" r="5" fill="#FF5E5E" stroke="#3E3E3E" strokeWidth="2" />
        <circle cx="115" cy="55" r="5" fill="#FF5E5E" stroke="#3E3E3E" strokeWidth="2" />
        <circle cx="100" cy="30" r="6" fill="#FF5E5E" stroke="#3E3E3E" strokeWidth="2" />
        <circle cx="75" cy="70" r="4" fill="#FF5E5E" stroke="#3E3E3E" strokeWidth="2" />
        
        {/* Cute face */}
        <circle cx="95" cy="48" r="2.5" fill="#3E3E3E" />
        <circle cx="105" cy="48" r="2.5" fill="#3E3E3E" />
        <path d="M98 53 Q100 56 102 53" stroke="#3E3E3E" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
    'Mature Tree': (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M40 160 L160 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 160 Q100 135 140 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        
        {/* Thicker trunk */}
        <path d="M100 145 Q115 90 100 45" stroke="#3E3E3E" strokeWidth="8" strokeLinecap="round" fill="none" />
        
        {/* Huge leaves/crown */}
        <path d="M102 120 Q140 110 130 140 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M98 100 Q60 90 70 120 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M103 80 Q145 70 130 95 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M97 60 Q55 50 70 75 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        
        {/* Big canopy */}
        <circle cx="100" cy="40" r="24" fill="#6FB345" stroke="#3E3E3E" strokeWidth="4" />
        
        {/* Big Fruits */}
        <circle cx="85" cy="30" r="6" fill="#FF5E5E" stroke="#3E3E3E" strokeWidth="2" />
        <circle cx="118" cy="45" r="6.5" fill="#FF5E5E" stroke="#3E3E3E" strokeWidth="2" />
        <circle cx="102" cy="20" r="7" fill="#FF5E5E" stroke="#3E3E3E" strokeWidth="2" />
        <circle cx="70" cy="60" r="5" fill="#FF5E5E" stroke="#3E3E3E" strokeWidth="2" />
        <circle cx="130" cy="70" r="5" fill="#FF5E5E" stroke="#3E3E3E" strokeWidth="2" />

        {/* Cute face */}
        <circle cx="94" cy="40" r="2.5" fill="#3E3E3E" />
        <circle cx="106" cy="40" r="2.5" fill="#3E3E3E" />
        <path d="M98 45 Q100 48 102 45" stroke="#3E3E3E" strokeWidth="2" strokeLinecap="round" fill="none" />
        
        {/* Sparkles */}
        <circle cx="65" cy="35" r="2" fill="#D4A96A" opacity="0.7" />
        <circle cx="135" cy="32" r="1.5" fill="#D4A96A" opacity="0.6" />
        <circle cx="118" cy="18" r="2" fill="#D4A96A" opacity="0.5" />
      </svg>
    )
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 'var(--space-4)',
      position: 'relative',
      ...style 
    }}>
      <div style={{ 
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: 'treeAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both'
      }}>
        {trees[stage]}
      </div>
      <span style={{
        marginTop: 'var(--space-4)',
        fontFamily: 'var(--font-family-mono)',
        fontSize: '0.75rem',
        color: 'var(--color-text-tertiary)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase'
      }}>
        {stage}
      </span>
      <style>{`
        @keyframes treeAppear {
          from { opacity: 0; transform: scale(0.85) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
