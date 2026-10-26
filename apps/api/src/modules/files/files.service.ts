import type { Readable } from 'node:stream';
import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Role } from '@sat/shared';
import { type Connection, Types } from 'mongoose';
import { FILE_STORAGE, type FileStorage, type StoredFileMeta } from '../../common/ports/storage.js';
import { notFound } from '../../common/tenancy/not-found.js';

@Injectable()
export class FilesService {
  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * Another workspace's file and a missing file are indistinguishable (ADR-0006). Lesson media of 004 (`lesson_files`)
   * reach an HV only through the signed, access-checked step links (004 NFR-6), never by id.
   */
  async open(
    id: string,
    workspaceId: string,
    role: Role = 'GV',
  ): Promise<{ stream: Readable; metadata: StoredFileMeta }> {
    if (role === 'HV' && Types.ObjectId.isValid(workspaceId)) {
      const lessonMedia = await this.connection
        .collection('lesson_files')
        .findOne(
          { workspaceId: new Types.ObjectId(workspaceId), fileId: id },
          { projection: { _id: 1 } },
        );
      if (lessonMedia) throw notFound();
    }
    const found = await this.storage.get(id);
    if (!found) throw notFound();
    if (found.metadata.workspaceId !== workspaceId) {
      found.stream.destroy();
      throw notFound();
    }
    return found;
  }
}
