"""
Modul API routes untuk dashboard segmentasi citra wajah.

Mendefinisikan endpoint-endpoint REST API untuk pemrosesan citra,
termasuk pipeline pemrosesan bertahap dan seleksi region.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import traceback

import_error = None
try:
    from backend.core.utils import decode_base64_image, encode_image_base64, to_grayscale
    from backend.core.preprocessing import compute_histogram, contrast_stretch
    from backend.core.filtering import low_pass_filter, high_pass_filter
    from backend.core.edge_detection import detect_edges
    from backend.core.segmentation import global_threshold, adaptive_threshold, region_flood_fill
except Exception as e:
    import_error = traceback.format_exc()


# ============================================================================
# Model Pydantic untuk validasi request/response
# ============================================================================


class GrayscaleSettings(BaseModel):
    """Pengaturan untuk filter grayscale."""

    enabled: bool = False


class ContrastSettings(BaseModel):
    """Pengaturan untuk peregangan kontras."""

    enabled: bool = False
    min_val: int = Field(default=0, ge=0, le=255)
    max_val: int = Field(default=255, ge=0, le=255)


class FilterSettings(BaseModel):
    """Pengaturan untuk filter spasial (low-pass atau high-pass)."""

    enabled: bool = False
    type: str = Field(default="low", pattern="^(low|high)$")
    kernel_size: int = Field(default=5, ge=1, le=31)
    method: str = Field(default="gaussian", pattern="^(gaussian|average)$")
    strength: float = Field(default=1.0, ge=0.0, le=10.0)


class EdgeDetectionSettings(BaseModel):
    """Pengaturan untuk deteksi tepi."""

    enabled: bool = False
    method: str = Field(default="canny", pattern="^(canny|sobel|prewitt)$")
    low_threshold: int = Field(default=50, ge=0, le=255)
    high_threshold: int = Field(default=150, ge=0, le=255)
    ksize: int = Field(default=3, ge=1, le=7)


class ThresholdSettings(BaseModel):
    """Pengaturan untuk segmentasi threshold."""

    enabled: bool = False
    type: str = Field(default="global", pattern="^(global|adaptive)$")
    value: int = Field(default=127, ge=0, le=255)
    block_size: int = Field(default=11, ge=3, le=99)
    C: int = Field(default=2, ge=-50, le=50)


class PipelineSettings(BaseModel):
    """Konfigurasi pipeline pemrosesan citra secara keseluruhan."""

    grayscale: GrayscaleSettings = GrayscaleSettings()
    contrast: ContrastSettings = ContrastSettings()
    filter: FilterSettings = FilterSettings()
    edge_detection: EdgeDetectionSettings = EdgeDetectionSettings()
    threshold: ThresholdSettings = ThresholdSettings()


class ProcessRequest(BaseModel):
    """Request body untuk endpoint /api/process."""

    image: str = Field(..., description="Citra dalam format base64 string")
    pipeline: PipelineSettings = PipelineSettings()


class ProcessResponse(BaseModel):
    """Response body untuk endpoint /api/process."""

    processed_image: str
    histogram: dict
    original_histogram: dict


class RegionSelectRequest(BaseModel):
    """Request body untuk endpoint /api/region-select."""

    image: str = Field(..., description="Citra dalam format base64 string")
    seed_x: int = Field(..., ge=0, description="Koordinat X titik benih")
    seed_y: int = Field(..., ge=0, description="Koordinat Y titik benih")
    tolerance: int = Field(default=20, ge=0, le=255, description="Toleransi flood fill")


class RegionSelectResponse(BaseModel):
    """Response body untuk endpoint /api/region-select."""

    result_image: str
    mask_image: str


# ============================================================================
# Router dan Endpoints
# ============================================================================

router = APIRouter()


@router.post("/api/process", response_model=ProcessResponse)
async def process_image(request: ProcessRequest) -> ProcessResponse:
    if import_error:
        raise HTTPException(status_code=500, detail=f"Import Error in Serverless Function:\n{import_error}")

    try:
        # Dekode citra input
        image = decode_base64_image(request.image)

        # Hitung histogram citra asli
        original_histogram = compute_histogram(image)

        # Jalankan pipeline pemrosesan secara berurutan
        processed = image.copy()

        # Tahap 0: Grayscale
        if request.pipeline.grayscale.enabled:
            processed = to_grayscale(processed)

        # Tahap 1: Peregangan Kontras
        if request.pipeline.contrast.enabled:
            processed = contrast_stretch(
                processed,
                min_val=request.pipeline.contrast.min_val,
                max_val=request.pipeline.contrast.max_val,
            )

        # Tahap 2: Filtering (Low-pass atau High-pass)
        if request.pipeline.filter.enabled:
            if request.pipeline.filter.type == "low":
                processed = low_pass_filter(
                    processed,
                    kernel_size=request.pipeline.filter.kernel_size,
                    method=request.pipeline.filter.method,
                )
            elif request.pipeline.filter.type == "high":
                processed = high_pass_filter(
                    processed,
                    strength=request.pipeline.filter.strength,
                )

        # Tahap 3: Deteksi Tepi
        if request.pipeline.edge_detection.enabled:
            edge_params = {}
            if request.pipeline.edge_detection.method == "canny":
                edge_params["low_threshold"] = request.pipeline.edge_detection.low_threshold
                edge_params["high_threshold"] = request.pipeline.edge_detection.high_threshold
            elif request.pipeline.edge_detection.method == "sobel":
                edge_params["ksize"] = request.pipeline.edge_detection.ksize

            processed = detect_edges(
                processed,
                method=request.pipeline.edge_detection.method,
                **edge_params,
            )

        # Tahap 4: Thresholding/Segmentasi
        if request.pipeline.threshold.enabled:
            if request.pipeline.threshold.type == "global":
                processed = global_threshold(
                    processed,
                    thresh_value=request.pipeline.threshold.value,
                )
            elif request.pipeline.threshold.type == "adaptive":
                processed = adaptive_threshold(
                    processed,
                    block_size=request.pipeline.threshold.block_size,
                    C=request.pipeline.threshold.C,
                )

        # Hitung histogram citra hasil pemrosesan
        result_histogram = compute_histogram(processed)

        # Enkode citra hasil ke base64
        processed_b64 = encode_image_base64(processed)

        return ProcessResponse(
            processed_image=processed_b64,
            histogram=result_histogram,
            original_histogram=original_histogram,
        )
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"Runtime Error in Serverless Function:\n{traceback.format_exc()}")


@router.post("/api/region-select", response_model=RegionSelectResponse)
async def region_select(request: RegionSelectRequest) -> RegionSelectResponse:
    if import_error:
        raise HTTPException(status_code=500, detail=f"Import Error in Serverless Function:\n{import_error}")

    try:
        # Dekode citra input
        image = decode_base64_image(request.image)

        # Jalankan flood fill
        result = region_flood_fill(
            image,
            seed_x=request.seed_x,
            seed_y=request.seed_y,
            tolerance=request.tolerance,
        )

        return RegionSelectResponse(
            result_image=result["result_image"],
            mask_image=result["mask_image"],
        )
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"Runtime Error in Serverless Function:\n{traceback.format_exc()}")
