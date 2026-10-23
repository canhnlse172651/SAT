import type { z } from 'zod';

/** Validates external input; a thrown `ZodError` becomes a 400 `VALIDATION_ERROR` in `ApiExceptionFilter`. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  return schema.parse(input);
}
