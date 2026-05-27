import React, { useState, useEffect, useCallback } from 'react';
import TopBar from './components/TopBar';
import Workspace from './components/Workspace';
import Sidebar from './components/Sidebar';
import useImageProcessor from './hooks/useImageProcessor';

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('seg-dashboard-theme');
    return saved || 'dark';
  });

  const {
    originalImage,
    processedImage,
    histogramData,
    originalHistogram,
    pipeline,
    isProcessing,
    error,
    historyIndex,
    history,
    regionToolActive,
    regionTolerance,
    cropToolActive,
    setRegionToolActive,
    setRegionTolerance,
    setCropToolActive,
    uploadImage,
    updatePipeline,
    undo,
    redo,
    exportImage,
    handleRegionSelect,
    applyCrop,
  } = useImageProcessor();

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('seg-dashboard-theme', theme);
  }, [theme]);

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleRegionTool = useCallback(() => {
    setRegionToolActive((v) => {
      if (!v) setCropToolActive(false); // mutually exclusive
      return !v;
    });
  }, [setRegionToolActive, setCropToolActive]);

  const toggleCropTool = useCallback(() => {
    setCropToolActive((v) => {
      if (!v) setRegionToolActive(false); // mutually exclusive
      return !v;
    });
  }, [setCropToolActive, setRegionToolActive]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}
    >
      <TopBar
        isProcessing={isProcessing}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo}
        onRedo={redo}
        onExport={exportImage}
        theme={theme}
        onToggleTheme={toggleTheme}
        hasProcessedImage={!!processedImage}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Workspace
          originalImage={originalImage}
          processedImage={processedImage}
          isRegionToolActive={regionToolActive}
          isCropToolActive={cropToolActive}
          onRegionSelect={handleRegionSelect}
          onCrop={applyCrop}
          onUpload={uploadImage}
        />

        {isMobile && (
          <div
            className={`drawer-backdrop ${sidebarOpen ? 'show' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          pipeline={pipeline}
          onUpdate={updatePipeline}
          histogramData={histogramData}
          originalHistogram={originalHistogram}
          onUpload={uploadImage}
          regionToolActive={regionToolActive}
          onRegionToolToggle={toggleRegionTool}
          regionTolerance={regionTolerance}
          onRegionToleranceChange={setRegionTolerance}
          cropToolActive={cropToolActive}
          onCropToolToggle={toggleCropTool}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Error toast */}
      {error && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
            zIndex: 100,
            maxWidth: 400,
            textAlign: 'center',
          }}
          className="fade-in"
        >
          {error}
        </div>
      )}
    </div>
  );
}
