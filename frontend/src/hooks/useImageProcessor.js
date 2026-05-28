import { useState, useCallback, useRef, useEffect } from 'react';
import { processImage, regionSelect } from '../utils/api';

const DEFAULT_PIPELINE = {
  grayscale: {
    enabled: false,
  },
  contrast: {
    enabled: false,
    min: 0,
    max: 255,
  },
  filter: {
    enabled: false,
    type: 'lowpass',
    method: 'gaussian',
    kernel_size: 5,
    strength: 1.0,
  },
  edge: {
    enabled: false,
    method: 'sobel',
    low_threshold: 50,
    high_threshold: 150,
  },
  threshold: {
    enabled: false,
    mode: 'global',
    value: 128,
    block_size: 11,
    c_value: 2,
  },
};

function resizeImage(base64Str, maxDimension = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str.startsWith('data:') ? base64Str : `data:image/jpeg;base64,${base64Str}`;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const compressedBase64 = dataUrl.split(',')[1];
      resolve(compressedBase64);
    };
    img.onerror = (err) => reject(err);
  });
}

export default function useImageProcessor() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [histogramData, setHistogramData] = useState(null);
  const [originalHistogram, setOriginalHistogram] = useState(null);
  const [pipeline, setPipeline] = useState(DEFAULT_PIPELINE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([DEFAULT_PIPELINE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [regionToolActive, setRegionToolActive] = useState(false);
  const [regionTolerance, setRegionTolerance] = useState(30);
  const [cropToolActive, setCropToolActive] = useState(false);
  const isFirstRender = useRef(true);

  const callApi = useCallback(
    async (image, pl) => {
      if (!image) return;
      setIsProcessing(true);
      setError(null);
      try {
        const result = await processImage(image, pl);
        if (result) {
          const rawBase64 = result.processed_image.includes(',')
            ? result.processed_image.split(',')[1]
            : result.processed_image;
          setProcessedImage(rawBase64);
          setHistogramData(result.histogram);
          setOriginalHistogram(result.original_histogram);
        }
      } catch (err) {
        console.error('Processing error:', err);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Auto-call API when pipeline changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (originalImage) {
      callApi(originalImage, pipeline);
    }
  }, [pipeline, originalImage, callApi]);

  const uploadImage = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const rawBase64 = e.target.result;
          const compressedBase64 = await resizeImage(rawBase64, 1024);
          setOriginalImage(compressedBase64);
          setProcessedImage(null);
          setHistogramData(null);
          setOriginalHistogram(null);
          setPipeline(DEFAULT_PIPELINE);
          setHistory([DEFAULT_PIPELINE]);
          setHistoryIndex(0);
          resolve(compressedBase64);
        } catch (err) {
          console.error('Error resizing uploaded image:', err);
          reject(err);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const updatePipeline = useCallback(
    (section, params) => {
      setPipeline((prev) => {
        const next = {
          ...prev,
          [section]: { ...prev[section], ...params },
        };
        setHistory((h) => {
          const trimmed = h.slice(0, historyIndex + 1);
          const newHistory = [...trimmed, next];
          setHistoryIndex(newHistory.length - 1);
          return newHistory;
        });
        return next;
      });
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPipeline(history[newIndex]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPipeline(history[newIndex]);
    }
  }, [historyIndex, history]);

  const exportImage = useCallback(() => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${processedImage}`;
    link.download = `segmented_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage]);

  const handleRegionSelect = useCallback(
    async (x, y) => {
      if (!originalImage) return;
      setIsProcessing(true);
      setError(null);
      try {
        const result = await regionSelect(originalImage, x, y, regionTolerance);
        if (result) {
          const rawBase64 = result.result_image.includes(',')
            ? result.result_image.split(',')[1]
            : result.result_image;
          setProcessedImage(rawBase64);
        }
      } catch (err) {
        console.error('Region select error:', err);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    },
    [originalImage, regionTolerance]
  );

  const applyCrop = useCallback((box) => {
    if (!originalImage || !box) return;
    const img = new Image();
    img.src = `data:image/png;base64,${originalImage}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = box.w;
      canvas.height = box.h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      // Use image/jpeg compression for cropped images to keep size small
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      setOriginalImage(croppedBase64);
      setProcessedImage(null);
      setHistogramData(null);
      setOriginalHistogram(null);
      setPipeline(DEFAULT_PIPELINE);
      setHistory([DEFAULT_PIPELINE]);
      setHistoryIndex(0);
      setCropToolActive(false);
    };
  }, [originalImage]);

  const setOriginalImageFromBase64 = useCallback((base64) => {
    setOriginalImage(base64);
    setProcessedImage(null);
    setHistogramData(null);
    setOriginalHistogram(null);
    setPipeline(DEFAULT_PIPELINE);
    setHistory([DEFAULT_PIPELINE]);
    setHistoryIndex(0);
  }, []);

  return {
    originalImage,
    processedImage,
    histogramData,
    originalHistogram,
    pipeline,
    isProcessing,
    error,
    history,
    historyIndex,
    regionToolActive,
    regionTolerance,
    cropToolActive,
    setRegionToolActive,
    setRegionTolerance,
    setCropToolActive,
    uploadImage,
    setOriginalImageFromBase64,
    updatePipeline,
    undo,
    redo,
    exportImage,
    handleRegionSelect,
    applyCrop,
  };
}
