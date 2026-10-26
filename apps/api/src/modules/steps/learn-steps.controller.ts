import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Put,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { type LearnStep, markBodySchema } from '@sat/shared';
import type { Response } from 'express';
import { z } from 'zod';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { FILE_STORAGE, type FileStorage } from '../../common/ports/storage.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { parse } from '../../common/validation/parse.js';
import { LearnStepsService } from './learn-steps.service.js';
import { StepFilesService } from './step-files.service.js';

const signedQuery = z.object({
  exp: z.coerce.number().int().positive(),
  sig: z.string().min(10).max(100),
  download: z.enum(['1']).optional(),
});
const hintQuery = z.object({
  continue: z.enum(['1']).optional(),
  lesson: z
    .string()
    .regex(/^[a-f0-9]{24}$/i)
    .optional(),
});

/** "bytes=start-end" of a Range header within `size`, or null (whole file). */
function rangeOf(header: string | undefined, size: number): { start: number; end: number } | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header ?? '');
  if (!m || (!m[1] && !m[2]) || size === 0) return null;
  let start = m[1] ? Number(m[1]) : size - Number(m[2]);
  let end = m[1] && m[2] ? Number(m[2]) : size - 1;
  start = Math.max(0, start);
  end = Math.min(size - 1, end);
  return start <= end ? { start, end } : null;
}

/** S03 / S04 for the HV (REQ-13, REQ-14, REQ-16). */
@Roles('HV')
@Controller('learn')
export class LearnStepsController {
  constructor(
    private readonly learn: LearnStepsService,
    private readonly files: StepFilesService,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {}

  /** `?continue=1` = the next action of an open S03 / S04 (AC-13.5); `lesson` = the Bài that screen showed. */
  @Get('classes/:classId/steps/:stepId')
  step(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('stepId') stepId: string,
    @Query() query: unknown,
  ): Promise<LearnStep> {
    const q = parse(hintQuery, query);
    return this.learn.view(p, classId, stepId, q.continue === '1', q.lesson);
  }

  @Put('marks')
  @HttpCode(204)
  async mark(
    @CurrentUser() p: AuthPrincipal,
    @Body() body: unknown,
    @Query() query: unknown,
  ): Promise<void> {
    await this.learn.mark(p, parse(markBodySchema, body), parse(hintQuery, query).lesson);
  }

  /** A signed file of the step (NFR-6), with byte ranges for seeking (AC-14.2); `download=1` = "Tải về" (AC-14.5). */
  @Get('classes/:classId/steps/:stepId/files/:fileId')
  async file(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('stepId') stepId: string,
    @Param('fileId') fileId: string,
    @Query() query: unknown,
    @Headers('range') rangeHeader: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const q = parse(signedQuery, query);
    await this.learn.file(p, classId, stepId, fileId, q);
    const row = await this.files.find(p.workspaceId, fileId);
    if (!row) throw notFound();
    const range = rangeOf(rangeHeader, row.size);
    const found = await this.storage.get(fileId, range ?? undefined);
    if (!found) throw notFound();
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Accept-Ranges', 'bytes');
    const kind = q.download === '1' ? 'attachment' : 'inline';
    const disposition = `${kind}; filename*=UTF-8''${encodeURIComponent(row.name)}`;
    if (range) {
      res.status(206);
      res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${row.size}`);
      return new StreamableFile(found.stream, {
        type: row.contentType,
        length: range.end - range.start + 1,
        disposition,
      });
    }
    return new StreamableFile(found.stream, {
      type: row.contentType,
      length: row.size,
      disposition,
    });
  }

  @Get('classes/:classId/steps/:stepId/files/:fileId/preview')
  async preview(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('stepId') stepId: string,
    @Param('fileId') fileId: string,
    @Query() query: unknown,
  ): Promise<{ pages: string[][] }> {
    await this.learn.file(p, classId, stepId, fileId, parse(signedQuery, query));
    return { pages: await this.learn.preview(p, fileId) };
  }
}
