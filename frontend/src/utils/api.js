let debounceTimer = null;

function debounce(fn, delay) {
  return (...args) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    return new Promise((resolve, reject) => {
      debounceTimer = setTimeout(() => {
        fn(...args).then(resolve).catch(reject);
      }, delay);
    });
  };
}

async function request(url, body) {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const response = await fetch(`${apiBase}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API error ${response.status}: ${errText}`);
  }
  return response.json();
}

const mapPipelineToApi = (pl) => {
  return {
    grayscale: {
      enabled: pl.grayscale?.enabled || false,
    },
    contrast: {
      enabled: pl.contrast.enabled,
      min_val: pl.contrast.min,
      max_val: pl.contrast.max,
    },
    filter: {
      enabled: pl.filter.enabled,
      type: pl.filter.type === 'highpass' ? 'high' : 'low',
      kernel_size: pl.filter.kernel_size,
      method: pl.filter.method,
      strength: pl.filter.strength,
    },
    edge_detection: {
      enabled: pl.edge.enabled,
      method: pl.edge.method,
      low_threshold: pl.edge.low_threshold,
      high_threshold: pl.edge.high_threshold,
      ksize: 3,
    },
    threshold: {
      enabled: pl.threshold.enabled,
      type: pl.threshold.mode,
      value: pl.threshold.value,
      block_size: pl.threshold.block_size,
      C: pl.threshold.c_value,
    },
  };
};

const processImageRaw = async (imageBase64, pipeline) => {
  const mappedPipeline = mapPipelineToApi(pipeline);
  return request('/api/process', { image: imageBase64, pipeline: mappedPipeline });
};

export const processImage = debounce(processImageRaw, 300);

export const regionSelect = async (imageBase64, seedX, seedY, tolerance) => {
  return request('/api/region-select', {
    image: imageBase64,
    seed_x: seedX,
    seed_y: seedY,
    tolerance: tolerance,
  });
};
