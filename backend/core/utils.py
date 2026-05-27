"""
Modul utilitas untuk pemrosesan citra dasar.

Menyediakan fungsi-fungsi helper untuk decode/encode base64,
konversi warna, dan operasi citra umum lainnya.
"""

import base64
import numpy as np
import cv2


def decode_base64_image(b64_string: str) -> np.ndarray:
    """Mendekode string base64 menjadi array NumPy citra OpenCV (BGR).

    Algoritma:
    1. Periksa apakah string mengandung prefix data URI (misalnya 'data:image/png;base64,').
       Jika ada, hapus prefix tersebut agar hanya tersisa data base64 murni.
    2. Decode string base64 menjadi bytes mentah menggunakan modul base64 standar Python.
    3. Konversi bytes mentah menjadi array NumPy bertipe uint8 (1 dimensi).
    4. Gunakan cv2.imdecode untuk membaca array bytes tersebut sebagai citra berwarna (BGR).
       Flag IMREAD_COLOR memastikan output selalu 3-channel.
    5. Jika proses decoding gagal (hasil None), raise ValueError.

    Args:
        b64_string: String base64, boleh dengan atau tanpa prefix data URI.

    Returns:
        np.ndarray: Citra dalam format BGR dengan dtype uint8.

    Raises:
        ValueError: Jika string base64 tidak valid atau tidak dapat didekode menjadi citra.
    """
    if not b64_string or not isinstance(b64_string, str):
        raise ValueError("Input base64 string tidak boleh kosong atau bukan string.")

    # Hapus prefix data URI jika ada (contoh: "data:image/png;base64,")
    if "," in b64_string and b64_string.startswith("data:"):
        b64_string = b64_string.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(b64_string)
    except Exception as e:
        raise ValueError(f"Gagal mendekode base64: {str(e)}")

    # Konversi bytes menjadi numpy array 1D
    np_array = np.frombuffer(image_bytes, dtype=np.uint8)

    if np_array.size == 0:
        raise ValueError("Data base64 menghasilkan array kosong.")

    # Decode menjadi citra BGR
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Gagal mendekode data base64 menjadi citra. Pastikan format citra valid.")

    return image


def encode_image_base64(image: np.ndarray, fmt: str = ".png") -> str:
    """Mengenkode citra OpenCV menjadi string base64 dengan prefix data URI.

    Algoritma:
    1. Validasi bahwa input adalah numpy array yang tidak kosong.
    2. Gunakan cv2.imencode untuk mengenkode citra ke format yang ditentukan
       (default: PNG). Fungsi ini mengembalikan tuple (success, buffer).
    3. Jika encoding gagal, raise ValueError.
    4. Konversi buffer hasil encoding menjadi bytes, lalu encode ke base64.
    5. Tentukan MIME type berdasarkan format (png -> image/png, jpg -> image/jpeg, dll).
    6. Gabungkan prefix data URI dengan string base64 dan kembalikan hasilnya.

    Args:
        image: Citra OpenCV dalam format numpy array (BGR atau grayscale).
        fmt: Format encoding citra (default '.png'). Mendukung '.png', '.jpg', '.jpeg', '.bmp'.

    Returns:
        str: String base64 lengkap dengan prefix data URI, contoh:
             'data:image/png;base64,iVBOR...'

    Raises:
        ValueError: Jika citra tidak valid atau encoding gagal.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Pastikan format diawali dengan titik
    if not fmt.startswith("."):
        fmt = f".{fmt}"

    success, buffer = cv2.imencode(fmt, image)

    if not success:
        raise ValueError(f"Gagal mengenkode citra ke format '{fmt}'.")

    # Encode buffer ke base64
    b64_bytes = base64.b64encode(buffer.tobytes())
    b64_string = b64_bytes.decode("utf-8")

    # Tentukan MIME type
    mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".bmp": "image/bmp",
        ".webp": "image/webp",
    }
    mime_type = mime_map.get(fmt.lower(), "image/png")

    return f"data:{mime_type};base64,{b64_string}"


def to_grayscale(image: np.ndarray) -> np.ndarray:
    """Mengonversi citra ke grayscale jika belum grayscale.

    Algoritma:
    1. Validasi bahwa input adalah numpy array yang tidak kosong.
    2. Periksa jumlah dimensi array:
       - Jika 2 dimensi (tinggi x lebar), citra sudah grayscale → kembalikan langsung.
       - Jika 3 dimensi dengan 1 channel, squeeze untuk menghilangkan dimensi ekstra.
       - Jika 3 dimensi dengan 3 atau 4 channel, konversi dari BGR/BGRA ke grayscale
         menggunakan cv2.cvtColor dengan flag COLOR_BGR2GRAY atau COLOR_BGRA2GRAY.
    3. Kembalikan citra grayscale 2D.

    Args:
        image: Citra OpenCV dalam format numpy array.

    Returns:
        np.ndarray: Citra grayscale 2D (tinggi x lebar) dengan dtype uint8.

    Raises:
        ValueError: Jika citra input tidak valid.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Citra input tidak valid atau kosong.")

    # Sudah grayscale (2 dimensi)
    if len(image.shape) == 2:
        return image

    # 3 dimensi
    if len(image.shape) == 3:
        channels = image.shape[2]

        if channels == 1:
            return image.squeeze(axis=2)
        elif channels == 3:
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        elif channels == 4:
            return cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
        else:
            raise ValueError(f"Jumlah channel tidak didukung: {channels}")

    raise ValueError(f"Dimensi citra tidak valid: {image.shape}")
