import React from 'react';

export default function CropToolControls({
  isActive,
  onToggle,
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
            <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
            <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
          </svg>
          Crop Image Tool
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
            ? 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(219,39,119,0.08))'
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
          boxShadow: isActive ? '0 0 20px rgba(236,72,153,0.2)' : 'none',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
        {isActive ? 'Deactivate Crop' : 'Activate Crop'}
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
            background: 'rgba(236, 72, 153, 0.08)',
            border: '1px solid rgba(236, 72, 153, 0.15)',
            fontSize: 11,
            color: 'var(--accent)',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          👆 Seret kursor pada citra untuk menyeleksi Crop
        </p>
      </div>
    </div>
  );
}
