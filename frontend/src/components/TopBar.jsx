import React from 'react';

export default function TopBar({
  isProcessing,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  theme,
  onToggleTheme,
  hasProcessedImage,
  isMobile,
  sidebarOpen,
  onToggleSidebar,
}) {
  return (
    <header
      className="glass-strong"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: isMobile ? '0 12px' : '0 20px',
        borderBottom: '1px solid var(--border)',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Left: Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10 }}>
        {!isMobile && (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 12px var(--accent-glow)',
            }}
          >
            <img 
              src="/logo.png" 
              alt="CK Studio" 
              style={{ 
                width: '85%', 
                height: '85%', 
                objectFit: 'contain' 
              }} 
            />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, lineHeight: 1.2, color: 'var(--text-primary)' }}>
            Segmentation Dashboard
          </h1>
          {!isMobile && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              Interactive Face Processing
            </p>
          )}
        </div>
      </div>

      {/* Center: Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 0 : 8,
          padding: isMobile ? '6px' : '6px 14px',
          borderRadius: 99,
          background: isProcessing ? 'rgba(139, 92, 246, 0.12)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${isProcessing ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.15)'}`,
        }}
      >
        {isProcessing ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        ) : (
          <div style={{ position: 'relative', width: 10, height: 10 }}>
            <div
              className="animate-pulse-ring"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'var(--success)',
              }}
            />
            <div
              className="animate-pulse-dot"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'var(--success)',
              }}
            />
          </div>
        )}
        {!isMobile && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isProcessing ? 'var(--accent)' : 'var(--success)',
            }}
          >
            {isProcessing ? 'Processing...' : 'Ready'}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6 }}>
        <button
          className="btn-icon tooltip-wrapper"
          data-tooltip="Undo"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
        </button>

        <button
          className="btn-icon tooltip-wrapper"
          data-tooltip="Redo"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 14 20 9 15 4" />
            <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
          </svg>
        </button>

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: isMobile ? '0 2px' : '0 4px' }} />

        <button
          className="btn-icon tooltip-wrapper"
          data-tooltip="Export Image"
          onClick={onExport}
          disabled={!hasProcessedImage}
          style={hasProcessedImage ? { color: 'var(--success)' } : {}}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        <button
          className="btn-icon tooltip-wrapper"
          data-tooltip={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {isMobile && (
          <>
            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />
            <button
              className={`btn-icon tooltip-wrapper ${sidebarOpen ? 'selection-active' : ''}`}
              data-tooltip="Show Controls"
              onClick={onToggleSidebar}
              style={{
                background: sidebarOpen ? 'var(--accent)' : 'transparent',
                color: sidebarOpen ? '#fff' : 'var(--text-secondary)',
                borderColor: sidebarOpen ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

