/**
 * Client-Side Magic Byte File Validator
 * Inspects leading file bytes before transmission to ensure file integrity.
 */

export async function validateClientMagicBytes(file: File): Promise<{
  valid: boolean;
  mimeType: string | null;
  category: 'image' | 'video' | 'unknown';
}> {
  try {
    const slice = file.slice(0, 16);
    const arrayBuffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 1. JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { valid: true, mimeType: 'image/jpeg', category: 'image' };
    }

    // 2. PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return { valid: true, mimeType: 'image/png', category: 'image' };
    }

    // 3. GIF: 47 49 46 38
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return { valid: true, mimeType: 'image/gif', category: 'image' };
    }

    // 4. WebP: 52 49 46 46 .... 57 45 42 50
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { valid: true, mimeType: 'image/webp', category: 'image' };
    }

    // 5. MP4 / MOV: 'ftyp' or 'moov' at offset 4
    const headerStr = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (headerStr === 'ftyp' || headerStr === 'moov') {
      return { valid: true, mimeType: 'video/mp4', category: 'video' };
    }

    // 6. WebM: 1A 45 DF A3
    if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      return { valid: true, mimeType: 'video/webm', category: 'video' };
    }

    return { valid: false, mimeType: null, category: 'unknown' };
  } catch (err) {
    return { valid: false, mimeType: null, category: 'unknown' };
  }
}
