import React from 'react';

export default function ThresholdControls({ pipeline, onUpdate }) {
  const threshold = pipeline.threshold;

  const toggleEnabled = () => {
    onUpdate('threshold', { enabled: !threshold.enabled });
  };

  const ensureOdd = (val) => {
    const v = parseInt(val, 10);
    return v % 2 === 0 ? v + 1 : v;
  };

  return (
    <div className="control-section fade-in">
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <line x1="6" y1="6" x2="6" y2="6" />
            <line x1="6" y1="18" x2="6" y2="18" />
          </svg>
          Segmentation
        </div>
        <div
          className={`toggle-switch ${threshold.enabled ? 'active' : ''}`}
          onClick={toggleEnabled}
          role="switch"
          aria-checked={threshold.enabled}
          tabIndex={0}
        />
      </div>

      <div
        style={{
          overflow: 'hidden',
          maxHeight: threshold.enabled ? 400 : 0,
          opacity: threshold.enabled ? 1 : 0,
          transition: 'max-height var(--transition-slow), opacity var(--transition-normal)',
        }}
      >
        {/* Mode Selection */}
        <div className="segmented-control" style={{ marginBottom: 14 }}>
          <button
            className={threshold.mode === 'global' ? 'active' : ''}
            onClick={() => onUpdate('threshold', { mode: 'global' })}
          >
            Global
          </button>
          <button
            className={threshold.mode === 'adaptive' ? 'active' : ''}
            onClick={() => onUpdate('threshold', { mode: 'adaptive' })}
          >
            Adaptive
          </button>
        </div>

        {/* Global Mode */}
        {threshold.mode === 'global' && (
          <div>
            <div className="slider-row">
              <div className="slider-label">
                <span>Threshold</span>
                <span className="slider-value">{threshold.value}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={threshold.value}
                onChange={(e) =>
                  onUpdate('threshold', { value: parseInt(e.target.value, 10) })
                }
              />
            </div>
            {/* Visual indicator */}
            <div
              style={{
                marginTop: 10,
                height: 8,
                borderRadius: 99,
                background: `linear-gradient(to right, #000 ${(threshold.value / 255) * 100}%, #fff ${(threshold.value / 255) * 100}%)`,
                border: '1px solid var(--border)',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 4,
                fontSize: 10,
                color: 'var(--text-muted)',
              }}
            >
              <span>Black</span>
              <span>White</span>
            </div>
          </div>
        )}

        {/* Adaptive Mode */}
        {threshold.mode === 'adaptive' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="slider-row">
              <div className="slider-label">
                <span>Block Size</span>
                <span className="slider-value">{threshold.block_size}</span>
              </div>
              <input
                type="range"
                min="3"
                max="99"
                step="2"
                value={threshold.block_size}
                onChange={(e) =>
                  onUpdate('threshold', { block_size: ensureOdd(e.target.value) })
                }
              />
            </div>
            <div className="slider-row">
              <div className="slider-label">
                <span>C Constant</span>
                <span className="slider-value">{threshold.c_value}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={threshold.c_value}
                onChange={(e) =>
                  onUpdate('threshold', { c_value: parseInt(e.target.value, 10) })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
