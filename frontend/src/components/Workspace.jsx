import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function Workspace({
  originalImage,
  processedImage,
  isRegionToolActive,
  isCropToolActive,
  onRegionSelect,
  onCrop,
  onUpload,
  onCameraOpen,
}) {
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [cropBox, setCropBox] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const hasOriginal = !!originalImage;
  const hasProcessed = !!processedImage;
  const showSplit = hasOriginal && hasProcessed;

  // Map click coordinates to image pixel coordinates
  const mapToImageCoords = useCallback(
    (clientX, clientY, clampOnly = false) => {
      if (!imgRef.current || !imgNatural.w) return null;
      const rect = imgRef.current.getBoundingClientRect();
      
      // Ignore clicks outside the actual visible image boundaries unless clampOnly is true
      if (!clampOnly) {
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          return null;
        }
      }
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const scaleX = imgNatural.w / rect.width;
      const scaleY = imgNatural.h / rect.height;
      
      // Clamp coordinates to natural image bounds to handle off-by-one roundings gracefully
      const targetX = Math.max(0, Math.min(imgNatural.w - 1, Math.round(x * scaleX)));
      const targetY = Math.max(0, Math.min(imgNatural.h - 1, Math.round(y * scaleY)));
      
      return {
        x: targetX,
        y: targetY,
      };
    },
    [imgNatural]
  );

  // Split view drag
  const handleSplitMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;
    const handleMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSplitPos(pct);
    };
    const handleUp = () => setIsDraggingSplit(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingSplit]);

  // Canvas click for region select
  const handleCanvasClick = useCallback(
    (e) => {
      if (!isRegionToolActive || !hasOriginal) return;
      const coords = mapToImageCoords(e.clientX, e.clientY, false);
      if (coords) {
        onRegionSelect(coords.x, coords.y);
      }
    },
    [isRegionToolActive, hasOriginal, mapToImageCoords, onRegionSelect]
  );

  useEffect(() => {
    if (!isCropToolActive) {
      setCropBox(null);
      setCropStart(null);
    }
  }, [isCropToolActive]);

  // Crop box drawing
  const handleMouseDown = useCallback(
    (e) => {
      if (isRegionToolActive || !isCropToolActive || !hasOriginal) return;
      const coords = mapToImageCoords(e.clientX, e.clientY, false);
      if (!coords) return;
      setCropStart(coords);
      setIsCropping(true);
      setCropBox(null);
    },
    [isRegionToolActive, isCropToolActive, hasOriginal, mapToImageCoords]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isCropping || !cropStart) return;
      const coords = mapToImageCoords(e.clientX, e.clientY, true);
      if (!coords) return;
      setCropBox({
        x: Math.min(cropStart.x, coords.x),
        y: Math.min(cropStart.y, coords.y),
        w: Math.abs(coords.x - cropStart.x),
        h: Math.abs(coords.y - cropStart.y),
      });
    },
    [isCropping, cropStart, mapToImageCoords]
  );

  const handleMouseUp = useCallback(() => {
    setIsCropping(false);
  }, []);

  const handleImgLoad = useCallback((e) => {
    setImgNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  }, []);

  // Crop overlay calculation
  const getCropOverlay = useCallback(() => {
    if (!cropBox || !imgRef.current || !imgNatural.w) return null;
    const rect = imgRef.current.getBoundingClientRect();
    const container = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imgNatural.w;
    const scaleY = rect.height / imgNatural.h;
    const offsetX = rect.left - container.left;
    const offsetY = rect.top - container.top;
    return {
      left: offsetX + cropBox.x * scaleX,
      top: offsetY + cropBox.y * scaleY,
      width: cropBox.w * scaleX,
      height: cropBox.h * scaleY,
    };
  }, [cropBox, imgNatural]);

  const cropOverlay = getCropOverlay();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  // Touch event handlers for crop/region operations
  const handleTouchStart = useCallback(
    (e) => {
      if (!hasOriginal) return;
      const touch = e.touches[0];
      if (!touch) return;

      if (isRegionToolActive) {
        const coords = mapToImageCoords(touch.clientX, touch.clientY, false);
        if (coords) {
          onRegionSelect(coords.x, coords.y);
        }
      } else if (isCropToolActive) {
        const coords = mapToImageCoords(touch.clientX, touch.clientY, false);
        if (!coords) return;
        if (e.cancelable) {
          e.preventDefault();
        }
        setCropStart(coords);
        setIsCropping(true);
        setCropBox(null);
      }
    },
    [isRegionToolActive, isCropToolActive, hasOriginal, mapToImageCoords, onRegionSelect]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isCropping || !cropStart) return;
      const touch = e.touches[0];
      if (!touch) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const coords = mapToImageCoords(touch.clientX, touch.clientY, true);
      if (!coords) return;
      setCropBox({
        x: Math.min(cropStart.x, coords.x),
        y: Math.min(cropStart.y, coords.y),
        w: Math.abs(coords.x - cropStart.x),
        h: Math.abs(coords.y - cropStart.y),
      });
    },
    [isCropping, cropStart, mapToImageCoords]
  );

  const handleTouchEnd = useCallback(() => {
    setIsCropping(false);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isRegionToolActive ? 'crosshair' : isCropping ? 'crosshair' : 'default',
      }}
      className="checkerboard"
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Empty State */}
      {!hasOriginal && (
        <div
          className="upload-area"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 40px',
            gap: 16,
            maxWidth: 400,
          }}
        >
          <div
            className="animate-float"
            style={{
              width: 72,
              height: 72,
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Drop an image or click to upload
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Supports JPEG, PNG, WebP, BMP
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCameraOpen();
            }}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              marginTop: 10,
              boxShadow: '0 4px 15px var(--accent-glow)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Ambil Foto (Kamera)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Single image (no processed yet) */}
      {hasOriginal && !hasProcessed && (
        <img
          ref={imgRef}
          src={`data:image/png;base64,${originalImage}`}
          alt="Original"
          onLoad={handleImgLoad}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}

      {/* Split View */}
      {showSplit && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Original (left side) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              clipPath: `inset(0 ${100 - splitPos}% 0 0)`,
            }}
          >
            <img
              src={`data:image/png;base64,${originalImage}`}
              alt="Original"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
            {/* Label */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                padding: '4px 12px',
                borderRadius: 99,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              Original
            </div>
          </div>

          {/* Processed (right side) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              clipPath: `inset(0 0 0 ${splitPos}%)`,
            }}
          >
            <img
              ref={imgRef}
              src={`data:image/png;base64,${processedImage}`}
              alt="Processed"
              onLoad={handleImgLoad}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
            {/* Label */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                padding: '4px 12px',
                borderRadius: 99,
                background: 'rgba(139, 92, 246, 0.7)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              Processed
            </div>
          </div>

          {/* Split Divider */}
          <div
            onMouseDown={handleSplitMouseDown}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${splitPos}%`,
              transform: 'translateX(-50%)',
              width: 32,
              cursor: 'col-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            {/* Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 2,
                background: '#fff',
                boxShadow: '0 0 8px rgba(0,0,0,0.5)',
              }}
            />
            {/* Handle */}
            <div
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 11,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round">
                <path d="M8 6l-4 6 4 6" />
                <path d="M16 6l4 6-4 6" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Crop Overlay */}
      {cropOverlay && isCropToolActive && !isRegionToolActive && (
        <div
          style={{
            position: 'absolute',
            left: cropOverlay.left,
            top: cropOverlay.top,
            width: cropOverlay.width,
            height: cropOverlay.height,
            border: '2px dashed var(--accent)',
            borderRadius: 2,
            pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
            zIndex: 20,
          }}
        >
          {/* Corner handles */}
          {[
            { top: -4, left: -4 },
            { top: -4, right: -4 },
            { bottom: -4, left: -4 },
            { bottom: -4, right: -4 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                ...pos,
                width: 8,
                height: 8,
                borderRadius: 2,
                background: '#fff',
                border: '1.5px solid var(--accent)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          ))}
          {/* Edge handles */}
          {[
            { top: -4, left: '50%', transform: 'translateX(-50%)' },
            { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
            { left: -4, top: '50%', transform: 'translateY(-50%)' },
            { right: -4, top: '50%', transform: 'translateY(-50%)' },
          ].map((pos, i) => (
            <div
              key={`e-${i}`}
              style={{
                position: 'absolute',
                ...pos,
                width: i < 2 ? 12 : 8,
                height: i < 2 ? 8 : 12,
                borderRadius: 2,
                background: '#fff',
                border: '1.5px solid var(--accent)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          ))}
          {/* Dimension label */}
          {cropBox && (
            <div
              style={{
                position: 'absolute',
                bottom: -24,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {cropBox.w} × {cropBox.h}
            </div>
          )}
        </div>
      )}

      {/* Floating Apply Crop Button */}
      {cropBox && isCropToolActive && !isCropping && cropOverlay && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCrop(cropBox);
          }}
          className="btn-primary"
          style={{
            position: 'absolute',
            left: cropOverlay.left + cropOverlay.width / 2,
            top: cropOverlay.top + cropOverlay.height + 14,
            transform: 'translateX(-50%)',
            zIndex: 40,
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
          Gunting Citra (Crop)
        </button>
      )}

      {/* Crop tool active indicator */}
      {isCropToolActive && hasOriginal && !cropBox && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 20px',
            borderRadius: 99,
            background: 'rgba(236, 72, 153, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#fff',
            }}
            className="animate-pulse-dot"
          />
          Seret kursor atau jari pada citra untuk menyeleksi Crop
        </div>
      )}

      {/* Region tool active indicator */}
      {isRegionToolActive && hasOriginal && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 20px',
            borderRadius: 99,
            background: 'rgba(139, 92, 246, 0.9)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#fff',
            }}
            className="animate-pulse-dot"
          />
          Klik atau sentuh pada citra untuk menyeleksi wilayah
        </div>
      )}
    </div>
  );
}
