import { type IndexOptions, type Schema, type SchemaOptions, Types } from 'mongoose';

/** Fields that never leave the API in a DTO. */
const INTERNAL_FIELDS: readonly string[] = ['_id', '__v', 'workspaceId'];

type Plain = Record<string, unknown>;

/** `_id` -> `id` (string), internal fields removed. Shared by schema transforms and `toDto`. */
export function transformDoc(ret: Plain): Plain {
  const out: Plain = {};
  if (ret['_id'] !== undefined) out['id'] = String(ret['_id']);
  for (const [key, value] of Object.entries(ret)) {
    if (INTERNAL_FIELDS.includes(key)) continue;
    out[key] = value instanceof Types.ObjectId ? value.toHexString() : value;
  }
  return out;
}

/** Options every business schema is created with (ADR-0006). `version` replaces `__v`. */
export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: { transform: (_doc: unknown, ret: Plain) => transformDoc(ret) },
  toObject: { transform: (_doc: unknown, ret: Plain) => transformDoc(ret) },
} satisfies SchemaOptions;

/** Schema field for the owning workspace: required and immutable. */
export const workspaceIdField = {
  type: Types.ObjectId,
  required: true,
  immutable: true,
} as const;

/** Schema field for optimistic concurrency (see `updateWithVersion`). */
export const versionField = { type: Number, required: true, default: 1, min: 1 } as const;

/** Declares a compound index that always starts with `workspaceId`. */
export function workspaceIndex(
  schema: Schema,
  fields: Record<string, 1 | -1>,
  options?: IndexOptions,
): void {
  schema.index({ workspaceId: 1, ...fields }, options ?? {});
}

/** Maps a document (or lean object) to a plain DTO; `pick` limits it to `id` plus the listed keys. */
export function toDto(doc: { toJSON(): unknown } | Plain, pick?: readonly string[]): Plain {
  const raw = (
    typeof (doc as { toJSON?: unknown }).toJSON === 'function'
      ? (doc as { toJSON(): unknown }).toJSON()
      : doc
  ) as Plain;
  const dto = '_id' in raw ? transformDoc(raw) : { ...raw };
  if (!pick) return dto;
  return Object.fromEntries(Object.entries(dto).filter(([k]) => k === 'id' || pick.includes(k)));
}
