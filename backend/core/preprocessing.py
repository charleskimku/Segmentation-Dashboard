"""
Modul preprocessing citra.

Menyediakan fungsi untuk analisis histogram dan peregangan kontras
(contrast stretching) sebagai tahap pra-pemrosesan sebelum segmentasi.
"""

import numpy as np
import cv2

from backend.core.utils import to_grayscale


def compute_histogram(image: np.ndarray) -> dict:
    """Menghitung histogram intensitas piksel dari citra.

    Algoritma:
    1. Periksa apakah citra adalah grayscale (2D) atau berwarna (3D).
    2. Untuk citra grayscale:
       - Gunakan cv2.calcHist dengan parameter [image], [0], None, [256], [0, 256].
       - cv2.calcHist menghitung distribusi frekuensi setiap nilai intensitas (0-255).
       - Hasilnya adalah array 256 elemen, di mana indeks ke-i menunjukkan jumlah piksel
         dengan intensitas i.
       - Kembalikan dictionary {'gray': [256 nilai]}.
    3. Untuk citra berwarna (BGR):
       - Hitung histogram secara terpisah untuk setiap channel (B, G, R).
       - Untuk channel ke-c, panggil cv2.calcHist([image], [c], None, [256], [0, 256]).
       - Kembalikan dictionary {'b': [...], 'g': [...], 'r': [...]}.
    4. Semua nilai histogram dikonversi dari float ke int untuk serialisasi JSON.

    Args:
        image: Citra OpenCV (grayscale 2D atau BGR 3D) dengan dtype uint8.

    Returns:
        dict: Dictionary berisi histogram. Kunci adalah 'gray' untuk grayscale,
              atau 'b', 'g', 'r' untuk citra berwarna. Setiap nilai adalah
              list berisi 256 bilangan bulat.

    Raises:
        ValueError: Jika citra input tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Citra grayscale (2 dimensi)
    if len(image.shape) == 2:
        hist = cv2.calcHist([image], [0], None, [256], [0, 256])
        return {"gray": hist.flatten().astype(int).tolist()}

    # Citra berwarna (3 dimensi, BGR)
    if len(image.shape) == 3:
        result = {}
        channel_names = ["b", "g", "r"]
        for i, name in enumerate(channel_names):
            hist = cv2.calcHist([image], [i], None, [256], [0, 256])
            result[name] = hist.flatten().astype(int).tolist()
        return result

    raise ValueError(f"Dimensi citra tidak didukung: {image.shape}")


def contrast_stretch(image: np.ndarray, min_val: int, max_val: int) -> np.ndarray:
    """Melakukan peregangan kontras linier (linear contrast stretching).

    Algoritma:
    1. Validasi parameter: min_val dan max_val harus dalam rentang [0, 255].
    2. Tangani edge case di mana min_val >= max_val:
       - Jika min_val == max_val, semua piksel di bawah threshold menjadi 0,
         piksel di atas menjadi 255, dan piksel sama dengan threshold menjadi 128.
       - Jika min_val > max_val, tukar kedua nilai agar min_val < max_val.
    3. Proses peregangan kontras:
       a. Klip semua piksel: nilai di bawah min_val diset ke min_val,
          nilai di atas max_val diset ke max_val.
          Menggunakan np.clip(image, min_val, max_val).
       b. Normalisasi ke rentang [0, 255] menggunakan rumus:
          output = ((pixel - min_val) / (max_val - min_val)) * 255
       c. Konversi hasil ke dtype uint8.
    4. Proses ini secara efektif "meregangkan" histogram citra sehingga
       rentang intensitas yang sempit dipetakan ke seluruh rentang 0-255,
       meningkatkan kontras visual citra.

    Args:
        image: Citra OpenCV (grayscale atau BGR) dengan dtype uint8.
        min_val: Batas bawah klipping intensitas (0-255).
        max_val: Batas atas klipping intensitas (0-255).

    Returns:
        np.ndarray: Citra hasil peregangan kontras dengan dtype uint8.

    Raises:
        ValueError: Jika citra input tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Klem nilai ke rentang valid
    min_val = int(np.clip(min_val, 0, 255))
    max_val = int(np.clip(max_val, 0, 255))

    # Tangani edge case min_val >= max_val
    if min_val > max_val:
        min_val, max_val = max_val, min_val

    if min_val == max_val:
        # Semua piksel di-threshold ke satu nilai tengah
        result = np.zeros_like(image, dtype=np.uint8)
        result[image > min_val] = 255
        result[image == min_val] = 128
        return result

    # Klip piksel ke rentang [min_val, max_val]
    clipped = np.clip(image, min_val, max_val).astype(np.float64)

    # Normalisasi ke [0, 255]
    stretched = ((clipped - min_val) / (max_val - min_val)) * 255.0

    return stretched.astype(np.uint8)
