import type { Readable } from 'node:stream';
import { Inject, Injectable } from '@nestjs/common';
import { FILE_STORAGE, type FileStorage, type StoredFileMeta } from '../../common/ports/storage.js';
import { notFound } from '../../common/tenancy/not-found.js';

@Injectable()
export class FilesService {
  constructor(@Inject(FILE_STORAGE) private readonly storage: FileStorage) {}

  /** Another workspace's file and a missing file are indistinguishable (ADR-0006). */
  async open(
    id: string,
    workspaceId: string,
  ): Promise<{ stream: Readable; metadata: StoredFileMeta }> {
    const found = await this.storage.get(id);
    if (!found) throw notFound();
    if (found.metadata.workspaceId !== workspaceId) {
      found.stream.destroy();
      throw notFound();
    }
    return found;
  }
}
