"""
Aplikasi utama FastAPI untuk Dashboard Interaktif Segmentasi Citra Wajah Manusia.

Modul ini menginisialisasi aplikasi FastAPI, mengkonfigurasi middleware CORS,
mendaftarkan router API, dan menyediakan endpoint health check.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import traceback

app_error = None
try:
    from backend.api.routes import router as api_router
except Exception as e:
    app_error = traceback.format_exc()


# ============================================================================
# Inisialisasi Aplikasi FastAPI
# ============================================================================

app = FastAPI(
    title="Dashboard Interaktif Segmentasi Citra Wajah Manusia",
    description=(
        "API backend untuk dashboard pemrosesan dan segmentasi citra wajah. "
        "Menyediakan pipeline pemrosesan citra bertahap meliputi peregangan kontras, "
        "filtering (low-pass/high-pass), deteksi tepi (Canny/Sobel/Prewitt), "
        "dan segmentasi (threshold global/adaptif, region flood fill). "
        "Semua operasi berbasis OpenCV dan NumPy."
    ),
    version="1.0.0",
)


# ============================================================================
# Middleware CORS
# ============================================================================
# Mengizinkan semua origin untuk pengembangan (development).
# Pada produksi, ganti allow_origins dengan daftar domain yang diizinkan.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Router API
# ============================================================================

if app_error:
    @app.post("/api/process")
    async def process_image_fallback(request: Request):
        return JSONResponse(
            status_code=500,
            content={"detail": f"Import Error during main.py initialization:\n{app_error}"}
        )

    @app.post("/api/region-select")
    async def region_select_fallback(request: Request):
        return JSONResponse(
            status_code=500,
            content={"detail": f"Import Error during main.py initialization:\n{app_error}"}
        )
else:
    app.include_router(api_router)


# ============================================================================
# Endpoint Health Check
# ============================================================================


@app.get("/")
async def health_check() -> dict:
    """Endpoint health check untuk memverifikasi bahwa server berjalan.

    Algoritma:
    1. Endpoint ini tidak memerlukan parameter apapun.
    2. Mengembalikan dictionary sederhana berisi status server dan nama aplikasi.
    3. Digunakan oleh load balancer, monitoring tools, atau frontend untuk
       memeriksa apakah backend API siap menerima request.

    Returns:
        dict: Dictionary dengan kunci 'status' dan 'application'.
    """
    return {
        "status": "healthy",
        "application": "Dashboard Interaktif Segmentasi Citra Wajah Manusia",
        "version": "1.0.0",
    }


# ============================================================================
# Exception Handler untuk ValueError
# ============================================================================


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """Menangani ValueError dan mengembalikan response HTTP 400 Bad Request.

    Algoritma:
    1. Tangkap semua ValueError yang terjadi selama pemrosesan request.
    2. ValueError biasanya dilempar oleh fungsi-fungsi core ketika:
       - Input base64 tidak valid atau corrupt.
       - Parameter pemrosesan di luar rentang yang diharapkan.
       - Citra tidak dapat didekode atau diproses.
    3. Kembalikan response JSON dengan status code 400 (Bad Request)
       dan pesan error yang informatif agar frontend dapat menampilkan
       pesan error yang tepat kepada pengguna.

    Args:
        request: Objek Request FastAPI.
        exc: Instance ValueError yang ditangkap.

    Returns:
        JSONResponse: Response dengan status 400 dan detail error.
    """
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )
