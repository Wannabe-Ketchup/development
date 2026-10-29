export abstract class MusicRepository {
  abstract save(urls: string[]): void;
  abstract findAll(): string[];
}
