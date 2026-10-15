/**
 * Magic Bytes Validator for High-Fidelity Image & Video Streams
 * Validates real binary signatures rather than relying solely on file extensions or headers.
 */

export interface MagicByteResult {
  valid: boolean;
  detectedMime: string | null;
  category: 'image' | 'video' | 'unknown';
}

export function validateMagicBytes(buffer: Buffer): MagicByteResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, detectedMime: null, category: 'unknown' };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, detectedMime: 'image/jpeg', category: 'image' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { valid: true, detectedMime: 'image/png', category: 'image' };
  }

  // 3. GIF: GIF87a or GIF89a (47 49 46 38 37/39 61)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { valid: true, detectedMime: 'image/gif', category: 'image' };
  }

  // 4. WebP: 'RIFF' .... 'WEBP'
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedMime: 'image/webp', category: 'image' };
  }

  // 5. MP4 / MOV / QuickTime: 'ftyp' or 'moov' signature at offset 4
  const boxType = buffer.toString('ascii', 4, 8);
  if (boxType === 'ftyp' || boxType === 'moov') {
    return { valid: true, detectedMime: 'video/mp4', category: 'video' };
  }

  // 6. WebM / Matroska: 1A 45 DF A3
  if (
    buffer[0] === 0x1A &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xDF &&
    buffer[3] === 0xA3
  ) {
    return { valid: true, detectedMime: 'video/webm', category: 'video' };
  }

  return { valid: false, detectedMime: null, category: 'unknown' };
}
