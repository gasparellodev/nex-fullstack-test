import { extname } from 'node:path';
import { UnprocessableError } from '@/shared/errors.js';
import type { IParser } from './IParser.js';

export class ParserRegistry {
  private readonly byExtension = new Map<string, IParser>();

  register(extension: string, parser: IParser): this {
    this.byExtension.set(extension.toLowerCase(), parser);
    return this;
  }

  forFilename(filename: string): IParser {
    const ext = extname(filename).toLowerCase();
    const parser = this.byExtension.get(ext);
    if (!parser) {
      throw new UnprocessableError(`unsupported file extension: ${ext || '(none)'}`, {
        field: 'file',
      });
    }
    return parser;
  }
}
