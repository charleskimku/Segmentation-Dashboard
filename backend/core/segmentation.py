"""
Modul segmentasi citra.

Menyediakan metode segmentasi berbasis threshold (global dan adaptif)
serta segmentasi berbasis region (flood fill) untuk memisahkan
objek dari latar belakang dalam citra.
"""

import numpy as np
import cv2

from backend.core.utils import to_grayscale, encode_image_base64


def global_threshold(image: np.ndarray, thresh_value: int = 127) -> np.ndarray:
    """Segmentasi citra menggunakan threshold global (ambang batas tunggal).

    Algoritma:
    1. Konversi citra ke grayscale jika belum (thresholding memerlukan citra 1 channel).
    2. Validasi nilai threshold ke rentang [0, 255].
    3. Terapkan cv2.threshold dengan mode THRESH_BINARY:
       - Untuk setiap piksel (x, y):
         * Jika intensitas(x, y) > thresh_value → output = 255 (putih/objek)
         * Jika intensitas(x, y) <= thresh_value → output = 0 (hitam/latar)
    4. Metode ini sederhana dan cepat, cocok untuk citra dengan distribusi
       intensitas bimodal (dua puncak histogram yang jelas terpisah).
    5. Kelemahannya: tidak adaptif terhadap variasi pencahayaan lokal.

    Args:
        image: Citra OpenCV (grayscale atau BGR).
        thresh_value: Nilai ambang batas (0-255, default 127).

    Returns:
        np.ndarray: Citra biner hasil thresholding (0 atau 255, uint8).

    Raises:
        ValueError: Jika citra input tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    gray = to_grayscale(image)

    # Klem threshold ke rentang valid
    thresh_value = int(np.clip(thresh_value, 0, 255))

    _, thresholded = cv2.threshold(gray, thresh_value, 255, cv2.THRESH_BINARY)

    return thresholded


def adaptive_threshold(
    image: np.ndarray, block_size: int = 11, C: int = 2
) -> np.ndarray:
    """Segmentasi citra menggunakan threshold adaptif Gaussian.

    Algoritma:
    1. Konversi citra ke grayscale jika belum.
    2. Validasi block_size:
       - Harus ganjil dan minimal 3 (persyaratan OpenCV).
       - Jika genap, tambahkan 1. Jika kurang dari 3, set ke 3.
    3. Terapkan cv2.adaptiveThreshold dengan metode ADAPTIVE_THRESH_GAUSSIAN_C:
       - Berbeda dengan threshold global yang menggunakan satu nilai untuk
         seluruh citra, threshold adaptif menghitung threshold berbeda
         untuk setiap piksel berdasarkan lingkungan lokalnya.
       - Untuk setiap piksel (x, y):
         a. Ambil jendela berukuran block_size × block_size yang berpusat di (x, y).
         b. Hitung rata-rata tertimbang Gaussian dari semua piksel dalam jendela.
            (Piksel yang lebih dekat ke pusat mendapat bobot lebih besar.)
         c. Threshold lokal = rata-rata_gaussian - C.
         d. Jika intensitas(x, y) > threshold_lokal → output = 255
            Jika tidak → output = 0
       - Parameter C berfungsi sebagai fine-tuning:
         * C positif: Lebih banyak piksel menjadi hitam (lebih ketat).
         * C negatif: Lebih banyak piksel menjadi putih (lebih longgar).
    4. Metode ini sangat efektif untuk citra dengan pencahayaan tidak merata
       (misalnya foto wajah dengan bayangan).

    Args:
        image: Citra OpenCV (grayscale atau BGR).
        block_size: Ukuran jendela lingkungan (harus ganjil, >= 3, default 11).
        C: Konstanta yang dikurangkan dari rata-rata (default 2).

    Returns:
        np.ndarray: Citra biner hasil thresholding adaptif (0 atau 255, uint8).

    Raises:
        ValueError: Jika citra input tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    gray = to_grayscale(image)

    # Validasi block_size: harus ganjil dan >= 3
    block_size = int(block_size)
    if block_size < 3:
        block_size = 3
    if block_size % 2 == 0:
        block_size += 1

    C = int(C)

    return cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        block_size,
        C,
    )


def region_flood_fill(
    image: np.ndarray, seed_x: int, seed_y: int, tolerance: int = 20
) -> dict:
    """Segmentasi region menggunakan algoritma flood fill dari titik benih.

    Algoritma:
    1. Validasi koordinat seed (titik benih):
       - seed_x harus dalam rentang [0, lebar-1].
       - seed_y harus dalam rentang [0, tinggi-1].
    2. Validasi tolerance (toleransi kesamaan warna): klem ke [0, 255].
    3. Siapkan citra dan mask untuk flood fill:
       - Buat salinan citra asli (agar tidak memodifikasi input).
       - Buat mask berukuran (h+2, w+2) diisi nol (persyaratan OpenCV:
         mask harus 2 piksel lebih besar dari citra di setiap dimensi).
    4. Konfigurasi flood fill:
       - loDiff = (tolerance, tolerance, tolerance): toleransi ke bawah untuk
         setiap channel. Piksel tetangga dianggap "mirip" jika nilainya
         >= (nilai_seed - tolerance) untuk setiap channel.
       - upDiff = (tolerance, tolerance, tolerance): toleransi ke atas.
         Piksel tetangga dianggap "mirip" jika nilainya
         <= (nilai_seed + tolerance) untuk setiap channel.
       - Flag FLOODFILL_MASK_ONLY: Hanya mengisi mask, tidak mengubah citra.
    5. Jalankan cv2.floodFill:
       - Mulai dari titik benih (seed_x, seed_y).
       - Algoritma mengeksplorasi piksel tetangga secara rekursif (BFS/DFS).
       - Piksel tetangga dimasukkan ke region jika perbedaan warnanya
         dengan piksel yang sudah ada di region berada dalam toleransi.
    6. Buat visualisasi hasil:
       - Ekstrak mask region (hapus padding 2 piksel).
       - Buat citra highlight: overlay warna semi-transparan pada region
         yang dipilih di atas citra asli.
    7. Kembalikan citra hasil dan mask dalam format base64.

    Args:
        image: Citra OpenCV (BGR) dengan dtype uint8.
        seed_x: Koordinat X titik benih (kolom, 0-indexed).
        seed_y: Koordinat Y titik benih (baris, 0-indexed).
        tolerance: Toleransi kesamaan warna (0-255, default 20).

    Returns:
        dict: Dictionary dengan kunci:
              - 'result_image': String base64 citra dengan region ter-highlight.
              - 'mask_image': String base64 mask biner dari region terpilih.

    Raises:
        ValueError: Jika koordinat seed di luar batas citra atau citra tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    h, w = image.shape[:2]

    # Validasi koordinat seed
    seed_x = int(seed_x)
    seed_y = int(seed_y)

    if seed_x < 0 or seed_x >= w:
        raise ValueError(
            f"Koordinat seed_x ({seed_x}) di luar batas citra (lebar: {w})."
        )
    if seed_y < 0 or seed_y >= h:
        raise ValueError(
            f"Koordinat seed_y ({seed_y}) di luar batas citra (tinggi: {h})."
        )

    # Klem tolerance
    tolerance = int(np.clip(tolerance, 0, 255))

    # Buat salinan citra dan mask
    flood_image = image.copy()
    mask = np.zeros((h + 2, w + 2), dtype=np.uint8)

    # Konfigurasi toleransi sesuai dengan jumlah channel
    channels = 1 if len(image.shape) == 2 else image.shape[2]
    lo_diff = tuple([tolerance] * channels)
    up_diff = tuple([tolerance] * channels)

    # Jalankan flood fill (hanya mengisi mask)
    flood_fill_flags = 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8)
    cv2.floodFill(
        flood_image,
        mask,
        seedPoint=(seed_x, seed_y),
        newVal=tuple([0] * channels),
        loDiff=lo_diff,
        upDiff=up_diff,
        flags=flood_fill_flags,
    )

    # Ekstrak mask tanpa padding (hapus border 1 piksel di setiap sisi)
    region_mask = mask[1 : h + 1, 1 : w + 1]

    # Pastikan result_image dan overlay memiliki format BGR agar bisa di-overlay warna hijau
    if len(image.shape) == 2:
        result_image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    else:
        result_image = image.copy()

    # Buat overlay berwarna hijau semi-transparan untuk region terpilih
    overlay = result_image.copy()
    overlay[region_mask == 255] = [0, 255, 0]  # Hijau untuk region terpilih

    # Blending: 60% citra asli + 40% overlay
    alpha = 0.6
    result_image = cv2.addWeighted(result_image, alpha, overlay, 1 - alpha, 0)

    # Buat citra mask untuk visualisasi (putih pada region, hitam di luar)
    mask_visual = np.zeros((h, w, 3), dtype=np.uint8)
    mask_visual[region_mask == 255] = [255, 255, 255]

    return {
        "result_image": encode_image_base64(result_image),
        "mask_image": encode_image_base64(mask_visual),
    }
