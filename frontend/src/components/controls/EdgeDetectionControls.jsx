import React from 'react';

export default function EdgeDetectionControls({ pipeline, onUpdate }) {
  const edge = pipeline.edge;

  const toggleEnabled = () => {
    onUpdate('edge', { enabled: !edge.enabled });
  };

  const methods = [
    { value: 'sobel', label: 'Sobel' },
    { value: 'prewitt', label: 'Prewitt' },
    { value: 'canny', label: 'Canny' },
  ];

  return (
    <div className="control-section fade-in">
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2" />
            <path d="M2 12h4l3-9 4 18 3-9h6" />
          </svg>
          Edge Detection
        </div>
        <div
          className={`toggle-switch ${edge.enabled ? 'active' : ''}`}
          onClick={toggleEnabled}
          role="switch"
          aria-checked={edge.enabled}
          tabIndex={0}
        />
      </div>

      <div
        style={{
          overflow: 'hidden',
          maxHeight: edge.enabled ? 400 : 0,
          opacity: edge.enabled ? 1 : 0,
          transition: 'max-height var(--transition-slow), opacity var(--transition-normal)',
        }}
      >
        {/* Method Selection */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {methods.map((m) => (
            <button
              key={m.value}
              onClick={() => onUpdate('edge', { method: m.value })}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${edge.method === m.value ? 'var(--accent)' : 'var(--border)'}`,
                background: edge.method === m.value
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))'
                  : 'transparent',
                color: edge.method === m.value ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: edge.method === m.value ? '0 0 12px var(--accent-glow)' : 'none',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Canny Thresholds */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: edge.method === 'canny' ? 200 : 0,
            opacity: edge.method === 'canny' ? 1 : 0,
            transition: 'max-height var(--transition-slow), opacity var(--transition-normal)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="slider-row">
              <div className="slider-label">
                <span>Low Threshold</span>
                <span className="slider-value">{edge.low_threshold}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={edge.low_threshold}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (v < edge.high_threshold) {
                    onUpdate('edge', { low_threshold: v });
                  }
                }}
              />
            </div>
            <div className="slider-row">
              <div className="slider-label">
                <span>High Threshold</span>
                <span className="slider-value">{edge.high_threshold}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={edge.high_threshold}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (v > edge.low_threshold) {
                    onUpdate('edge', { high_threshold: v });
                  }
                }}
              />
            </div>
            {edge.low_threshold >= edge.high_threshold && (
              <p style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 500 }}>
                ⚠ Low must be less than High
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
