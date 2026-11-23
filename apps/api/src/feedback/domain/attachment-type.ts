export const ATTACHMENT_TYPE = {
  PNG: { extension: 'png', mimeType: 'image/png' },
  JPEG: { extension: 'jpg', mimeType: 'image/jpeg' },
  GIF: { extension: 'gif', mimeType: 'image/gif' },
  WEBP: { extension: 'webp', mimeType: 'image/webp' },
  MP4: { extension: 'mp4', mimeType: 'video/mp4' },
  MOV: { extension: 'mov', mimeType: 'video/quicktime' },
  WEBM: { extension: 'webm', mimeType: 'video/webm' },
} as const;

export type AttachmentType =
  (typeof ATTACHMENT_TYPE)[keyof typeof ATTACHMENT_TYPE];

export const ATTACHMENT_HEADER_BYTES = 64;

const MP4_BRANDS = [
  'isom',
  'iso2',
  'iso3',
  'iso4',
  'iso5',
  'iso6',
  'mp41',
  'mp42',
  'avc1',
  'dash',
  'M4V ',
];
const MOV_BRANDS = ['qt  '];
const EBML_MAGIC = [0x1a, 0x45, 0xdf, 0xa3];
const EBML_DOC_TYPE_ID = [0x42, 0x82];

function startsWith(header: Uint8Array, bytes: number[], offset = 0): boolean {
  return bytes.every((byte, i) => header[offset + i] === byte);
}

function ascii(header: Uint8Array, start: number, end: number): string {
  return Buffer.from(header.subarray(start, end)).toString('latin1');
}

function isWebm(header: Uint8Array): boolean {
  if (!startsWith(header, EBML_MAGIC)) return false;
  for (let i = EBML_MAGIC.length; i + 3 < header.length; i++) {
    if (!startsWith(header, EBML_DOC_TYPE_ID, i)) continue;
    const length = header[i + 2] & 0x7f;
    return (
      (header[i + 2] & 0x80) !== 0 &&
      ascii(header, i + 3, i + 3 + length) === 'webm'
    );
  }
  return false;
}

// 허용 형식이 아니거나 판별할 만큼 길지 않으면 undefined
export function detectAttachmentType(
  header: Uint8Array,
): AttachmentType | undefined {
  if (startsWith(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return ATTACHMENT_TYPE.PNG;
  }
  if (startsWith(header, [0xff, 0xd8, 0xff])) return ATTACHMENT_TYPE.JPEG;
  if (['GIF87a', 'GIF89a'].includes(ascii(header, 0, 6))) {
    return ATTACHMENT_TYPE.GIF;
  }
  if (header.length >= 12) {
    if (ascii(header, 0, 4) === 'RIFF' && ascii(header, 8, 12) === 'WEBP') {
      return ATTACHMENT_TYPE.WEBP;
    }
    if (ascii(header, 4, 8) === 'ftyp') {
      const brand = ascii(header, 8, 12);
      if (MP4_BRANDS.includes(brand)) return ATTACHMENT_TYPE.MP4;
      if (MOV_BRANDS.includes(brand)) return ATTACHMENT_TYPE.MOV;
    }
  }
  if (isWebm(header)) return ATTACHMENT_TYPE.WEBM;
  return undefined;
}
