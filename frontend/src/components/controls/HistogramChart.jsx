import React, { useRef, useEffect, useCallback } from 'react';

export default function HistogramChart({ data, minVal = 0, maxVal = 255, onRangeChange }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const drawHistogram = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const container = containerRef.current;
    const dpr = window.devicePixelRatio || 1;
    const width = container.offsetWidth;
    const height = 100;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const values = data.gray || data.r || [];
    if (values.length === 0) return;

    const maxFreq = Math.max(...values, 1);
    const barWidth = width / 256;
    const padding = 4;
    const chartHeight = height - padding * 2;

    // Draw shaded region BEFORE minVal
    if (minVal > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, (minVal / 255) * width, height);
    }

    // Draw shaded region AFTER maxVal
    if (maxVal < 255) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      const startX = (maxVal / 255) * width;
      ctx.fillRect(startX, 0, width - startX, height);
    }

    // Draw bars
    for (let i = 0; i < 256; i++) {
      const v = values[i] || 0;
      const barH = (v / maxFreq) * chartHeight;
      const x = i * barWidth;
      const y = height - padding - barH;

      const isInRange = i >= minVal && i <= maxVal;
      if (isInRange) {
        const gradient = ctx.createLinearGradient(x, y, x, height - padding);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.9)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.3)';
      }

      ctx.fillRect(x, y, Math.max(barWidth - 0.5, 0.5), barH);
    }

    // Draw range indicator lines
    const drawLine = (val, color) => {
      const x = (val / 255) * width;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    drawLine(minVal, 'rgba(139, 92, 246, 0.8)');
    drawLine(maxVal, 'rgba(99, 102, 241, 0.8)');
  }, [data, minVal, maxVal]);

  useEffect(() => {
    drawHistogram();
    const handleResize = () => drawHistogram();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawHistogram]);

  return (
    <div className="control-section fade-in">
      <div className="section-header">
        <div className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <rect x="7" y="10" width="3" height="11" rx="0.5" fill="currentColor" opacity="0.3" />
            <rect x="12" y="5" width="3" height="16" rx="0.5" fill="currentColor" opacity="0.3" />
            <rect x="17" y="8" width="3" height="13" rx="0.5" fill="currentColor" opacity="0.3" />
          </svg>
          Histogram
        </div>
      </div>
      <div ref={containerRef} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>
      {onRangeChange && (
        <div style={{ marginTop: 12 }}>
          <div className="slider-row">
            <div className="slider-label">
              <span>Contrast Min</span>
              <span className="slider-value">{minVal}</span>
            </div>
            <input
              type="range"
              min="0"
              max="254"
              value={minVal}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (v < maxVal) onRangeChange(v, maxVal);
              }}
            />
          </div>
          <div className="slider-row" style={{ marginTop: 10 }}>
            <div className="slider-label">
              <span>Contrast Max</span>
              <span className="slider-value">{maxVal}</span>
            </div>
            <input
              type="range"
              min="1"
              max="255"
              value={maxVal}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (v > minVal) onRangeChange(minVal, v);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
