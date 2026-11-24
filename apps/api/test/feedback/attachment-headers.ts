type Part = number[] | string;

function bytes(...parts: Part[]): Uint8Array {
  const flat = parts.flatMap((part) =>
    typeof part === 'string' ? Array.from(Buffer.from(part, 'latin1')) : part,
  );
  return Uint8Array.from([...flat, ...new Array<number>(16).fill(0)]);
}

export const PNG_HEADER = bytes([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
export const JPEG_HEADER = bytes([0xff, 0xd8, 0xff, 0xe0]);
export const GIF_HEADER = bytes('GIF89a');
export const WEBP_HEADER = bytes('RIFF', [0, 0, 0, 0], 'WEBP');
export const MP4_HEADER = bytes([0, 0, 0, 0x18], 'ftyp', 'isom');
export const MOV_HEADER = bytes([0, 0, 0, 0x14], 'ftyp', 'qt  ');
export const WEBM_HEADER = bytes(
  [0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x84],
  'webm',
);

export const EXE_HEADER = bytes('MZ');
export const HEIC_HEADER = bytes([0, 0, 0, 0x18], 'ftyp', 'heic');
export const AVIF_HEADER = bytes([0, 0, 0, 0x18], 'ftyp', 'avif');
export const MKV_HEADER = bytes(
  [0x1a, 0x45, 0xdf, 0xa3, 0xa3, 0x42, 0x82, 0x88],
  'matroska',
);
export const WAV_HEADER = bytes('RIFF', [0, 0, 0, 0], 'WAVE');
export const EMPTY_HEADER = new Uint8Array(0);
export const TRUNCATED_PNG_HEADER = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);
