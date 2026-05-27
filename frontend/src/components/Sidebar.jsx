import React, { useRef } from 'react';
import HistogramChart from './controls/HistogramChart';
import FilterControls from './controls/FilterControls';
import EdgeDetectionControls from './controls/EdgeDetectionControls';
import ThresholdControls from './controls/ThresholdControls';
import RegionToolControls from './controls/RegionToolControls';
import CropToolControls from './controls/CropToolControls';

export default function Sidebar({
  pipeline,
  onUpdate,
  histogramData,
  originalHistogram,
  onUpload,
  regionToolActive,
  onRegionToolToggle,
  regionTolerance,
  onRegionToleranceChange,
  cropToolActive,
  onCropToolToggle,
  isMobile,
  isOpen,
  onClose,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <aside
      className={`glass-strong ${isMobile ? 'mobile-drawer' : ''} ${isMobile && isOpen ? 'open' : ''}`}
      style={{
        width: isMobile ? '100%' : 380,
        minWidth: isMobile ? 0 : 380,
        maxWidth: isMobile ? 380 : 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: isMobile ? 'none' : '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 18px 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Processing Pipeline
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
              Configure image operations
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()} style={isMobile ? { padding: '8px 10px' } : {}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {!isMobile && ' Upload'}
            </button>
            {isMobile && (
              <button
                className="btn-icon"
                onClick={onClose}
                style={{ width: 32, height: 32 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Scrollable Controls */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Histogram */}
        {(histogramData || originalHistogram) && (
          <HistogramChart
            data={histogramData || originalHistogram}
            minVal={pipeline.contrast.min}
            maxVal={pipeline.contrast.max}
            onRangeChange={(min, max) =>
              onUpdate('contrast', { enabled: true, min, max })
            }
          />
        )}

        <FilterControls pipeline={pipeline} onUpdate={onUpdate} />

        {/* Grayscale Mode */}
        <div className="control-section fade-in">
          <div className="section-header">
            <div className="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
              </svg>
              Grayscale Mode
            </div>
            <div
              className={`toggle-switch ${pipeline.grayscale?.enabled ? 'active' : ''}`}
              onClick={() => onUpdate('grayscale', { enabled: !pipeline.grayscale?.enabled })}
              role="switch"
              aria-checked={pipeline.grayscale?.enabled || false}
              tabIndex={0}
            />
          </div>
        </div>

        <EdgeDetectionControls pipeline={pipeline} onUpdate={onUpdate} />

        <ThresholdControls pipeline={pipeline} onUpdate={onUpdate} />

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

        <RegionToolControls
          isActive={regionToolActive}
          onToggle={onRegionToolToggle}
          tolerance={regionTolerance}
          onToleranceChange={onRegionToleranceChange}
        />

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

        <CropToolControls
          isActive={cropToolActive}
          onToggle={onCropToolToggle}
        />

        {/* Spacer */}
        <div style={{ height: 20 }} />
      </div>
    </aside>
  );
}
