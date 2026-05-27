import React from 'react';

export default function FilterControls({ pipeline, onUpdate }) {
  const filter = pipeline.filter;

  const toggleEnabled = () => {
    onUpdate('filter', { enabled: !filter.enabled });
  };

  const setType = (type) => {
    onUpdate('filter', { type });
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
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Image Filtering
        </div>
        <div
          className={`toggle-switch ${filter.enabled ? 'active' : ''}`}
          onClick={toggleEnabled}
          role="switch"
          aria-checked={filter.enabled}
          tabIndex={0}
        />
      </div>

      <div
        style={{
          overflow: 'hidden',
          maxHeight: filter.enabled ? 400 : 0,
          opacity: filter.enabled ? 1 : 0,
          transition: 'max-height var(--transition-slow), opacity var(--transition-normal)',
        }}
      >
        {/* Filter Type */}
        <div className="segmented-control" style={{ marginBottom: 14 }}>
          <button
            className={filter.type === 'lowpass' ? 'active' : ''}
            onClick={() => setType('lowpass')}
          >
            Low Pass
          </button>
          <button
            className={filter.type === 'highpass' ? 'active' : ''}
            onClick={() => setType('highpass')}
          >
            High Pass
          </button>
        </div>

        {/* Low Pass Controls */}
        {filter.type === 'lowpass' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Method
              </label>
              <div className="segmented-control">
                <button
                  className={filter.method === 'gaussian' ? 'active' : ''}
                  onClick={() => onUpdate('filter', { method: 'gaussian' })}
                >
                  Gaussian
                </button>
                <button
                  className={filter.method === 'average' ? 'active' : ''}
                  onClick={() => onUpdate('filter', { method: 'average' })}
                >
                  Average
                </button>
              </div>
            </div>
            <div className="slider-row">
              <div className="slider-label">
                <span>Kernel Size</span>
                <span className="slider-value">{filter.kernel_size}</span>
              </div>
              <input
                type="range"
                min="1"
                max="31"
                step="2"
                value={filter.kernel_size}
                onChange={(e) =>
                  onUpdate('filter', { kernel_size: ensureOdd(e.target.value) })
                }
              />
            </div>
          </div>
        )}

        {/* High Pass Controls */}
        {filter.type === 'highpass' && (
          <div className="slider-row">
            <div className="slider-label">
              <span>Strength</span>
              <span className="slider-value">{filter.strength.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={filter.strength}
              onChange={(e) =>
                onUpdate('filter', { strength: parseFloat(e.target.value) })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
