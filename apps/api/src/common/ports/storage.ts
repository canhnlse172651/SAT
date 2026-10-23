import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Schema, type Model } from 'mongoose';
import { AppError } from '../../errors.js';

export interface PutFileInput {
  workspaceId: string;
  ownerId: string;
  filename: string;
  contentType: string;
  bytes?: Uint8Array;
  stream?: Readable;
}

export interface FileMeta {
  id: string;
  size: number;
  contentType: string;
}

export interface StoredFileMeta extends FileMeta {
  workspaceId: string;
  ownerId: string;
  filename: string;
}

export interface FileStorage {
  put(input: PutFileInput): Promise<FileMeta>;
  /** Returns null when the id is unknown. Authorisation (workspace check) is the caller's job. */
  get(id: string): Promise<{ stream: Readable; metadata: StoredFileMeta } | null>;
  delete(id: string): Promise<void>;
}

/** Injection token for the FileStorage port. */
export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface StorageOptions {
  /** Max bytes per file (default 20 MiB). */
  maxBytes?: number;
  /** Allowed content types; undefined = any. */
  allowedContentTypes?: readonly string[];
}

export const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;
export const STORAGE_OPTIONS = Symbol('STORAGE_OPTIONS');
export const STORAGE_ROOT = Symbol('STORAGE_ROOT');
export const FILE_MODEL = 'StoredFile';

const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

export function assertSafeFilename(filename: string): void {
  if (
    filename.length === 0 ||
    filename.length > 255 ||
    filename === '.' ||
    filename === '..' ||
    /[/\\\0]/.test(filename)
  ) {
    throw new AppError(400, 'INVALID_FILENAME', 'Tên tệp không hợp lệ');
  }
}

function validate(input: PutFileInput, options: StorageOptions): void {
  assertSafeFilename(input.filename);
  if (options.allowedContentTypes && !options.allowedContentTypes.includes(input.contentType)) {
    throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'Định dạng tệp không được hỗ trợ');
  }
}

async function collect(input: PutFileInput, maxBytes: number): Promise<Buffer> {
  const tooBig = () => new AppError(413, 'FILE_TOO_LARGE', 'Tệp vượt quá dung lượng cho phép');
  if (input.bytes) {
    if (input.bytes.byteLength > maxBytes) throw tooBig();
    return Buffer.from(input.bytes);
  }
  if (!input.stream) throw new AppError(400, 'EMPTY_FILE', 'Thiếu nội dung tệp');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of input.stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    size += buf.length;
    if (size > maxBytes) {
      input.stream.destroy();
      throw tooBig();
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export const fileSchema = new Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true },
  },
  { collection: 'files', timestamps: true },
);

interface FileDoc extends StoredFileMeta {
  storageKey: string;
}

/** Dev adapter: bytes on local disk under `root/<workspaceId>/<uuid>`, metadata in `files`. */
@Injectable()
export class LocalDiskStorage implements FileStorage {
  constructor(
    @InjectModel(FILE_MODEL) private readonly model: Model<FileDoc>,
    @Inject(STORAGE_ROOT) private readonly root: string,
    @Inject(STORAGE_OPTIONS) private readonly options: StorageOptions,
  ) {}

  async put(input: PutFileInput): Promise<FileMeta> {
    validate(input, this.options);
    if (!SAFE_SEGMENT.test(input.workspaceId)) {
      throw new AppError(400, 'INVALID_WORKSPACE', 'Workspace không hợp lệ');
    }
    const bytes = await collect(input, this.options.maxBytes ?? DEFAULT_MAX_BYTES);
    const storageKey = `${input.workspaceId}/${randomUUID()}`;
    const target = path.join(this.root, storageKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    const doc = await this.model.create({
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      filename: input.filename,
      contentType: input.contentType,
      size: bytes.length,
      storageKey,
    });
    return { id: doc._id.toString(), size: bytes.length, contentType: input.contentType };
  }

  async get(id: string): Promise<{ stream: Readable; metadata: StoredFileMeta } | null> {
    const doc = await this.findDoc(id);
    if (!doc) return null;
    return {
      stream: createReadStream(path.join(this.root, doc.storageKey)),
      metadata: {
        id,
        workspaceId: doc.workspaceId,
        ownerId: doc.ownerId,
        filename: doc.filename,
        contentType: doc.contentType,
        size: doc.size,
      },
    };
  }

  async delete(id: string): Promise<void> {
    const doc = await this.findDoc(id);
    if (!doc) return;
    await rm(path.join(this.root, doc.storageKey), { force: true });
    await this.model.deleteOne({ _id: id });
  }

  private async findDoc(id: string): Promise<FileDoc | null> {
    if (!/^[a-f0-9]{24}$/i.test(id)) return null;
    return (await this.model.findById(id).lean()) as FileDoc | null;
  }
}

/** Unit-test adapter. */
export class MemoryStorage implements FileStorage {
  private readonly files = new Map<string, { meta: StoredFileMeta; bytes: Buffer }>();
  private seq = 0;

  constructor(private readonly options: StorageOptions = {}) {}

  async put(input: PutFileInput): Promise<FileMeta> {
    validate(input, this.options);
    const bytes = await collect(input, this.options.maxBytes ?? DEFAULT_MAX_BYTES);
    const id = `mem-${++this.seq}`;
    const meta = {
      id,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      filename: input.filename,
      contentType: input.contentType,
      size: bytes.length,
    };
    this.files.set(id, { meta, bytes });
    return { id, size: bytes.length, contentType: input.contentType };
  }

  get(id: string): Promise<{ stream: Readable; metadata: StoredFileMeta } | null> {
    const f = this.files.get(id);
    return Promise.resolve(f ? { stream: Readable.from([f.bytes]), metadata: f.meta } : null);
  }

  delete(id: string): Promise<void> {
    this.files.delete(id);
    return Promise.resolve();
  }
}
