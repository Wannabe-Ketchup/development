import { BadRequestException } from '@nestjs/common';
import { detectAttachmentType } from './attachment-type';

const FILE_NAME_MAX_BYTES = 250;
const HIDDEN_OR_PATH_CHARACTERS = /[\p{Cc}\p{Cf}/\\]/gu;
const LAST_EXTENSION = /\.[^.]*$/;

function truncateByBytes(value: string, maxBytes: number): string {
  let result = '';
  let bytes = 0;
  for (const character of value) {
    bytes += Buffer.byteLength(character);
    if (bytes > maxBytes) break;
    result += character;
  }
  return result;
}

export class Attachment {
  private constructor(
    readonly fileName: string,
    readonly mimeType: string,
    readonly path: string,
    readonly size: number,
  ) {}

  static of(props: {
    order: number;
    originalName: string;
    header: Uint8Array;
    path: string;
    size: number;
  }): Attachment {
    const type =
      props.size > 0 ? detectAttachmentType(props.header) : undefined;
    if (!type) {
      throw new BadRequestException('첨부할 수 없는 파일 형식입니다.');
    }
    const baseName = truncateByBytes(
      props.originalName
        .replace(HIDDEN_OR_PATH_CHARACTERS, '')
        .replace(LAST_EXTENSION, ''),
      FILE_NAME_MAX_BYTES,
    );
    return new Attachment(
      `${baseName || `attachment-${props.order}`}.${type.extension}`,
      type.mimeType,
      props.path,
      props.size,
    );
  }

  static restore(props: {
    fileName: string;
    mimeType: string;
    path: string;
    size: number;
  }): Attachment {
    return new Attachment(
      props.fileName,
      props.mimeType,
      props.path,
      props.size,
    );
  }
}
