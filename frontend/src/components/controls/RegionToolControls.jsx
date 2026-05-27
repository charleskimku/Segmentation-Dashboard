import React from 'react';

export default function RegionToolControls({
  isActive,
  onToggle,
  tolerance,
  onToleranceChange,
}) {
  return (
    <div
      className={`control-section fade-in ${isActive ? 'selection-active' : ''}`}
      style={{
        borderColor: isActive ? 'var(--accent)' : undefined,
      }}
    >
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" />
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </svg>
          Region Selection
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
          background: isActive
            ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))'
            : 'var(--bg-tertiary)',
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all var(--transition-fast)',
          boxShadow: isActive ? '0 0 20px var(--accent-glow)' : 'none',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isActive ? (
            <>
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </>
          ) : (
            <>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </>
          )}
        </svg>
        {isActive ? 'Deactivate Tool' : 'Activate Region Tool'}
      </button>

      {/* Instruction text */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isActive ? 100 : 0,
          opacity: isActive ? 1 : 0,
          transition: 'max-height var(--transition-slow), opacity var(--transition-normal)',
        }}
      >
        <p
          style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            fontSize: 11,
            color: 'var(--accent)',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          👆 Click on the image to select a region
        </p>
      </div>

      {/* Tolerance */}
      <div className="slider-row" style={{ marginTop: 12 }}>
        <div className="slider-label">
          <span>Tolerance</span>
          <span className="slider-value">{tolerance}</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={tolerance}
          onChange={(e) => onToleranceChange(parseInt(e.target.value, 10))}
        />
      </div>
    </div>
  );
}
