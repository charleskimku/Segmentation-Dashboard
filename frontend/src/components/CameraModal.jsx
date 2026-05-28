import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (deviceId) => {
    setIsLoading(true);
    setErrorMsg('');
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    const constraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: 'user' }, // default to front camera/user facing
      audio: false,
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorText = 'Gagal mengakses kamera. Pastikan Anda mengizinkan akses kamera di browser dan tidak digunakan oleh aplikasi lain.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorText = 'Akses kamera ditolak. Silakan klik ikon gembok/informasi di sebelah kiri bilah alamat browser Anda (URL bar) dan aktifkan izin Kamera.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorText = 'Kamera tidak ditemukan. Pastikan perangkat kamera (webcam) terpasang dengan benar dan aktif.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorText = 'Kamera sedang digunakan oleh aplikasi lain (seperti Zoom, Teams, WhatsApp, Google Meet, tab browser lain, dll). Silakan tutup aplikasi tersebut lalu coba lagi.';
      } else if (err.name === 'SecurityError') {
        errorText = 'Akses kamera diblokir karena koneksi tidak aman (harus menggunakan HTTPS atau localhost). Pastikan URL website Anda dimulai dengan https://.';
      }
      setErrorMsg(errorText);
      setIsLoading(false);
    }
  }, [stream]);

  // Get available video devices (useful for switching cameras on mobile)
  const loadDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((device) => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !activeDeviceId) {
        // Find default or first active device
        setActiveDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  }, [activeDeviceId]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDevices().then(() => {
        startCamera(activeDeviceId);
      });
    } else {
      stopCamera();
    }
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Handle switching camera device
  const handleSwitchCamera = () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;
    setActiveDeviceId(nextDeviceId);
    startCamera(nextDeviceId);
  };

  // Capture snapshot from video frame
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || isLoading) return;

    const ctx = canvas.getContext('2d');
    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    // Draw the current video frame onto the canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Convert canvas image to base64 PNG data
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    onCapture(base64);
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      className="fade-in"
    >
      <div
        className="glass-strong"
        style={{
          width: '100%',
          maxWidth: 540,
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 30px var(--accent-glow)',
          animation: 'slide-up 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
              Ambil Foto Wajah
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Posisikan wajah Anda di tengah kamera
            </p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="btn-icon"
            style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.05)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Video stream viewport */}
        <div
          style={{
            position: 'relative',
            backgroundColor: '#000',
            aspectRatio: '4/3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="spinner" style={{ width: 36, height: 36 }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Mengaktifkan kamera...</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#f87171',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // mirror reflection
              display: isLoading || errorMsg ? 'none' : 'block',
            }}
          />

          {/* Guidelines overlay */}
          {!isLoading && !errorMsg && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '2px dashed rgba(255,255,255,0.2)',
                borderRadius: '50%',
                margin: '15%',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
        >
          {/* Switch Camera for Mobile */}
          {devices.length > 1 && !errorMsg && (
            <button
              onClick={handleSwitchCamera}
              className="btn-icon"
              style={{
                position: 'absolute',
                left: 24,
                width: 42,
                height: 42,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
              title="Ganti Kamera"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
          )}

          {/* Shutter Button */}
          <button
            onClick={handleCapture}
            disabled={isLoading || !!errorMsg}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#fff',
              border: '6px solid rgba(255,255,255,0.2)',
              cursor: isLoading || errorMsg ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(255,255,255,0.2)',
              transition: 'all 0.15s ease',
              opacity: isLoading || errorMsg ? 0.5 : 1,
            }}
            className="shutter-btn"
            title="Ambil Foto"
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                transition: 'transform 0.1s ease',
              }}
              className="shutter-inner"
            />
          </button>
        </div>
      </div>

      {/* Hidden Canvas for capture processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
