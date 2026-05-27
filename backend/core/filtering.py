"""
Modul filtering citra.

Menyediakan filter low-pass (penghalusan) dan high-pass (penajaman)
untuk pra-pemrosesan citra sebelum tahap segmentasi.
"""

import numpy as np
import cv2


def low_pass_filter(
    image: np.ndarray, kernel_size: int = 5, method: str = "gaussian"
) -> np.ndarray:
    """Menerapkan filter low-pass (penghalusan/smoothing) pada citra.

    Algoritma:
    1. Validasi parameter kernel_size:
       - Harus berupa bilangan bulat positif ganjil (1, 3, 5, 7, ...).
       - Jika genap, tambahkan 1 agar menjadi ganjil (persyaratan OpenCV).
       - Jika kurang dari 1, set ke 1.
    2. Pilih metode filter berdasarkan parameter 'method':
       a. 'gaussian' (Gaussian Blur):
          - Menggunakan cv2.GaussianBlur dengan kernel (ksize x ksize) dan sigma=0.
          - Filter Gaussian memberikan bobot lebih besar pada piksel pusat
            dan bobot menurun secara Gaussian ke arah tepi kernel.
          - Sigma=0 berarti OpenCV menghitung sigma secara otomatis dari ukuran kernel.
          - Efektif mengurangi noise Gaussian sambil mempertahankan tepi lebih baik
            dibanding rata-rata biasa.
       b. 'average' (Mean/Box Filter):
          - Menggunakan cv2.blur dengan kernel (ksize x ksize).
          - Setiap piksel output adalah rata-rata aritmetika dari semua piksel
            dalam jendela kernel. Semua bobot sama (1/(ksize*ksize)).
          - Lebih sederhana tetapi cenderung mengaburkan tepi lebih banyak.
    3. Kembalikan citra hasil filtering.

    Args:
        image: Citra OpenCV (grayscale atau BGR) dengan dtype uint8.
        kernel_size: Ukuran kernel filter (harus ganjil, default 5).
        method: Metode filter - 'gaussian' atau 'average' (default 'gaussian').

    Returns:
        np.ndarray: Citra hasil filtering dengan dimensi dan tipe sama seperti input.

    Raises:
        ValueError: Jika citra input tidak valid atau metode tidak dikenali.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Pastikan kernel_size valid (positif dan ganjil)
    kernel_size = max(1, int(kernel_size))
    if kernel_size % 2 == 0:
        kernel_size += 1

    method = method.lower().strip()

    if method == "gaussian":
        return cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
    elif method == "average":
        return cv2.blur(image, (kernel_size, kernel_size))
    else:
        raise ValueError(
            f"Metode filter tidak dikenali: '{method}'. "
            f"Gunakan 'gaussian' atau 'average'."
        )


def high_pass_filter(image: np.ndarray, strength: float = 1.0) -> np.ndarray:
    """Menerapkan filter high-pass (penajaman) menggunakan teknik unsharp masking.

    Algoritma:
    1. Validasi parameter strength (kekuatan penajaman).
       Jika negatif, set ke 0 (tidak ada efek penajaman).
    2. Teknik Unsharp Masking bekerja sebagai berikut:
       a. Buat versi blur (low-pass) dari citra asli menggunakan Gaussian blur
          dengan kernel 5x5 dan sigma=0. Versi blur ini merepresentasikan
          komponen frekuensi rendah citra.
       b. Hitung komponen frekuensi tinggi (detail/tepi) dengan mengurangkan
          citra blur dari citra asli: detail = original - blurred.
       c. Tambahkan komponen detail kembali ke citra asli dengan faktor pengali
          (strength): result = original + strength * detail.
       d. Secara matematis: result = original + strength * (original - blurred)
          = (1 + strength) * original - strength * blurred.
    3. Klip hasil ke rentang [0, 255] untuk mencegah overflow/underflow.
    4. Konversi kembali ke dtype uint8.

    Prinsip: Unsharp masking menguatkan perbedaan antara piksel asli dan
    versi blur-nya. Area dengan perubahan intensitas tajam (tepi) akan
    diperkuat, sedangkan area halus (flat) hampir tidak berubah.

    Args:
        image: Citra OpenCV (grayscale atau BGR) dengan dtype uint8.
        strength: Faktor kekuatan penajaman (default 1.0).
                  Nilai lebih tinggi = penajaman lebih kuat.
                  Nilai 0 = tidak ada perubahan.

    Returns:
        np.ndarray: Citra hasil penajaman dengan dtype uint8.

    Raises:
        ValueError: Jika citra input tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Pastikan strength tidak negatif
    strength = max(0.0, float(strength))

    # Jika strength 0, kembalikan citra asli tanpa perubahan
    if strength == 0.0:
        return image.copy()

    # Buat versi blur menggunakan Gaussian blur
    blurred = cv2.GaussianBlur(image, (5, 5), 0)

    # Konversi ke float untuk perhitungan presisi tinggi
    image_float = image.astype(np.float64)
    blurred_float = blurred.astype(np.float64)

    # Hitung hasil unsharp masking:
    # result = original + strength * (original - blurred)
    detail = image_float - blurred_float
    sharpened = image_float + strength * detail

    # Klip ke [0, 255] dan konversi ke uint8
    sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)

    return sharpened
