"""
Modul deteksi tepi (edge detection).

Menyediakan berbagai metode deteksi tepi termasuk Sobel, Prewitt,
dan Canny untuk mengidentifikasi batas-batas objek dalam citra.
"""

import numpy as np
import cv2

from backend.core.utils import to_grayscale


def detect_edges(image: np.ndarray, method: str = "canny", **params) -> np.ndarray:
    """Fungsi dispatcher untuk deteksi tepi yang memanggil metode yang sesuai.

    Algoritma:
    1. Konversi citra ke grayscale jika belum (deteksi tepi bekerja pada
       citra satu channel untuk menganalisis perubahan intensitas).
    2. Berdasarkan parameter 'method', panggil fungsi deteksi tepi yang sesuai:
       - 'sobel': Memanggil sobel_edge() dengan parameter ksize.
       - 'prewitt': Memanggil prewitt_edge() tanpa parameter tambahan.
       - 'canny': Memanggil canny_edge() dengan parameter low_threshold dan high_threshold.
    3. Setiap metode mengembalikan citra biner/grayscale yang menunjukkan
       lokasi tepi dalam citra.

    Args:
        image: Citra OpenCV (grayscale atau BGR).
        method: Metode deteksi tepi - 'canny', 'sobel', atau 'prewitt' (default 'canny').
        **params: Parameter tambahan yang diteruskan ke fungsi deteksi tepi:
                  - Untuk 'sobel': ksize (int, default 3)
                  - Untuk 'canny': low_threshold (int), high_threshold (int)

    Returns:
        np.ndarray: Citra hasil deteksi tepi (grayscale, uint8).

    Raises:
        ValueError: Jika metode tidak dikenali atau citra tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Konversi ke grayscale untuk deteksi tepi
    gray = to_grayscale(image)

    method = method.lower().strip()

    if method == "sobel":
        ksize = params.get("ksize", 3)
        return sobel_edge(gray, ksize=ksize)
    elif method == "prewitt":
        return prewitt_edge(gray)
    elif method == "canny":
        low_threshold = params.get("low_threshold", 50)
        high_threshold = params.get("high_threshold", 150)
        return canny_edge(gray, low_threshold=low_threshold, high_threshold=high_threshold)
    else:
        raise ValueError(
            f"Metode deteksi tepi tidak dikenali: '{method}'. "
            f"Gunakan 'canny', 'sobel', atau 'prewitt'."
        )


def sobel_edge(image: np.ndarray, ksize: int = 3) -> np.ndarray:
    """Deteksi tepi menggunakan operator Sobel.

    Algoritma:
    1. Pastikan ksize ganjil dan dalam rentang valid (1, 3, 5, atau 7 untuk Sobel).
    2. Hitung gradien arah horizontal (Sobel X):
       - cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=ksize)
       - Kernel Sobel X mendeteksi perubahan intensitas arah horizontal.
       - Untuk ksize=3, kernel: [[-1,0,1], [-2,0,2], [-1,0,1]]
    3. Hitung gradien arah vertikal (Sobel Y):
       - cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=ksize)
       - Kernel Sobel Y mendeteksi perubahan intensitas arah vertikal.
       - Untuk ksize=3, kernel: [[-1,-2,-1], [0,0,0], [1,2,1]]
    4. Hitung magnitude gradien (kekuatan tepi) di setiap piksel:
       - magnitude = sqrt(sobel_x^2 + sobel_y^2)
       - Menggunakan cv2.magnitude() untuk perhitungan efisien.
    5. Normalisasi magnitude ke rentang [0, 255]:
       - Menggunakan cv2.normalize dengan NORM_MINMAX.
       - Ini memastikan nilai piksel terdistribusi di seluruh rentang intensitas.
    6. Konversi ke uint8 dan kembalikan.

    Args:
        image: Citra grayscale (2D numpy array).
        ksize: Ukuran kernel Sobel (harus ganjil: 1, 3, 5, atau 7, default 3).

    Returns:
        np.ndarray: Citra magnitude tepi (grayscale, uint8, rentang 0-255).

    Raises:
        ValueError: Jika citra input tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Pastikan ksize valid untuk Sobel (1, 3, 5, atau 7)
    ksize = int(ksize)
    if ksize < 1:
        ksize = 1
    if ksize % 2 == 0:
        ksize += 1
    if ksize > 7:
        ksize = 7

    # Hitung gradien Sobel pada kedua arah menggunakan presisi float64
    sobel_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=ksize)
    sobel_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=ksize)

    # Hitung magnitude gradien: sqrt(Gx^2 + Gy^2)
    magnitude = cv2.magnitude(sobel_x, sobel_y)

    # Normalisasi ke rentang [0, 255]
    magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)

    return magnitude.astype(np.uint8)


def prewitt_edge(image: np.ndarray) -> np.ndarray:
    """Deteksi tepi menggunakan operator Prewitt.

    Algoritma:
    1. Definisikan kernel Prewitt untuk deteksi tepi horizontal dan vertikal:
       - Kernel horizontal (mendeteksi tepi vertikal):
         [[1,  1,  1],
          [0,  0,  0],
          [-1, -1, -1]]
       - Kernel vertikal (mendeteksi tepi horizontal):
         [[1,  0, -1],
          [1,  0, -1],
          [1,  0, -1]]
       Kernel vertikal adalah transpose dari kernel horizontal.
    2. Terapkan masing-masing kernel menggunakan cv2.filter2D:
       - cv2.filter2D melakukan konvolusi 2D antara citra dan kernel.
       - Menggunakan depth CV_64F untuk presisi tinggi (menghindari clipping).
    3. Hitung magnitude gradien:
       - magnitude = sqrt(prewitt_x^2 + prewitt_y^2)
    4. Normalisasi ke [0, 255] dan konversi ke uint8.

    Perbedaan dengan Sobel: Prewitt menggunakan bobot seragam (semua 1)
    sedangkan Sobel memberikan bobot lebih besar pada baris/kolom tengah (2).
    Sobel lebih tahan noise karena efek smoothing tambahan.

    Args:
        image: Citra grayscale (2D numpy array).

    Returns:
        np.ndarray: Citra magnitude tepi (grayscale, uint8, rentang 0-255).

    Raises:
        ValueError: Jika citra input tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Definisikan kernel Prewitt
    kernel_x = np.array(
        [[1, 1, 1],
         [0, 0, 0],
         [-1, -1, -1]],
        dtype=np.float64,
    )

    # Kernel vertikal adalah transpose dari kernel horizontal
    kernel_y = kernel_x.T

    # Terapkan konvolusi 2D dengan masing-masing kernel
    prewitt_x = cv2.filter2D(image, cv2.CV_64F, kernel_x)
    prewitt_y = cv2.filter2D(image, cv2.CV_64F, kernel_y)

    # Hitung magnitude gradien
    magnitude = cv2.magnitude(prewitt_x, prewitt_y)

    # Normalisasi ke [0, 255]
    magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)

    return magnitude.astype(np.uint8)


def canny_edge(
    image: np.ndarray, low_threshold: int = 50, high_threshold: int = 150
) -> np.ndarray:
    """Deteksi tepi menggunakan algoritma Canny.

    Algoritma:
    1. Validasi threshold: pastikan low_threshold < high_threshold.
       Jika tidak, tukar keduanya. Klem ke rentang [0, 255].
    2. Algoritma Canny (dilakukan internal oleh OpenCV) terdiri dari 5 tahap:
       a. Penghalusan Gaussian: Mengurangi noise menggunakan filter Gaussian 5x5.
       b. Perhitungan Gradien: Menghitung gradien intensitas menggunakan operator Sobel
          pada arah horizontal dan vertikal.
       c. Non-Maximum Suppression (NMS): Menipiskan tepi menjadi selebar 1 piksel.
          Untuk setiap piksel, periksa apakah magnitude gradiennya adalah maksimum
          lokal searah gradien. Jika tidak, piksel tersebut ditekan (diset ke 0).
       d. Double Threshold (Ambang Ganda): Klasifikasikan piksel tepi menjadi:
          - Kuat (strong): magnitude >= high_threshold
          - Lemah (weak): low_threshold <= magnitude < high_threshold
          - Bukan tepi: magnitude < low_threshold
       e. Hysteresis Tracking: Piksel lemah dianggap tepi hanya jika terhubung
          (8-connected) dengan piksel kuat. Ini menghilangkan tepi palsu dari noise.
    3. Hasil adalah citra biner: 255 untuk tepi, 0 untuk bukan tepi.

    Args:
        image: Citra grayscale (2D numpy array).
        low_threshold: Ambang bawah untuk hysteresis (default 50).
        high_threshold: Ambang atas untuk hysteresis (default 150).

    Returns:
        np.ndarray: Citra biner hasil deteksi tepi (0 atau 255, uint8).

    Raises:
        ValueError: Jika citra input tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Klem threshold ke rentang valid
    low_threshold = int(np.clip(low_threshold, 0, 255))
    high_threshold = int(np.clip(high_threshold, 0, 255))

    # Pastikan low < high
    if low_threshold >= high_threshold:
        low_threshold, high_threshold = min(low_threshold, high_threshold), max(
            low_threshold, high_threshold
        )
        # Jika masih sama setelah swap, buat jarak minimal
        if low_threshold == high_threshold:
            low_threshold = max(0, high_threshold - 50)

    return cv2.Canny(image, low_threshold, high_threshold)
