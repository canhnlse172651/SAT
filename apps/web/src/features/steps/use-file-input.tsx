import type { FileKind } from '@sat/shared';
import { FILE_RULES } from '@sat/shared';
import { useRef } from 'react';

/** `accept` of a file input: the extensions of the kind. */
const acceptOf = (kind: FileKind) =>
  Object.keys(FILE_RULES[kind].types)
    .map((e) => `.${e}`)
    .join(',');

/** A hidden file input opened by a button. */
export function useFileInput(kind: FileKind, onFile: (file: File) => void) {
  const input = useRef<HTMLInputElement>(null);
  const element = (
    <input
      ref={input}
      type="file"
      hidden
      accept={acceptOf(kind)}
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) onFile(file);
      }}
    />
  );
  return { element, open: () => input.current?.click() };
}
