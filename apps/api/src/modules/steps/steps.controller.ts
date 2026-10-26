import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  type FileRef,
  type ImportPreview,
  type Storage,
  type StepsInfo,
  fileKindSchema,
} from '@sat/shared';
import type { Request, Response } from 'express';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { parse } from '../../common/validation/parse.js';
import { pathId } from '../curriculum/path-id.js';
import { ExcelService } from './excel.service.js';
import { StepFilesService } from './step-files.service.js';
import { StepsService } from './steps.service.js';

/** T07 / T08 (GV): side data, uploads and storage, document previews, Excel template and import (REQ-5, REQ-6, REQ-12). */
@Roles('GV')
@Controller('steps')
export class StepsController {
  constructor(
    private readonly steps: StepsService,
    private readonly files: StepFilesService,
    private readonly excel: ExcelService,
  ) {}

  @Get('lessons/:id/info')
  info(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<StepsInfo> {
    return this.steps.info(p, pathId(id));
  }

  @Get('storage')
  storage(@CurrentUser() p: AuthPrincipal): Promise<Storage> {
    return this.files.usage(p.workspaceId);
  }

  /** The raw file is the body (`application/octet-stream`); its name is `X-File-Name` (URI-encoded). */
  @Post('files')
  @HttpCode(201)
  upload(
    @CurrentUser() p: AuthPrincipal,
    @Query('kind') kind: unknown,
    @Headers('x-file-name') name: string | undefined,
    @Headers('content-length') length: string | undefined,
    @Req() req: Request,
  ): Promise<FileRef> {
    const k = parse(fileKindSchema, kind);
    let decoded: string;
    try {
      decoded = decodeURIComponent(name ?? '');
    } catch {
      decoded = name ?? '';
    }
    return this.files.upload(p.workspaceId, p.userId, k, decoded, Number(length) || 0, req);
  }

  /** Text pages of a DOCX / PPTX (T21 viewer). */
  @Get('files/:fileId/preview')
  async preview(@CurrentUser() p: AuthPrincipal, @Param('fileId') fileId: string) {
    const pages = await this.files.preview(p.workspaceId, fileId);
    if (!pages) throw notFound();
    return { pages };
  }

  @Get('template.xlsx')
  template(@Res({ passthrough: true }) res: Response): StreamableFile {
    res.setHeader('Cache-Control', 'private');
    return new StreamableFile(this.excel.template(), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent('mau-tu-vung.xlsx')}`,
    });
  }

  /** The raw .xlsx is the body (≤ 5 MB is checked by the service; larger bodies are 413). */
  @Post('import')
  @HttpCode(200)
  import(@CurrentUser() p: AuthPrincipal, @Req() req: Request): ImportPreview {
    const body: unknown = req.body;
    return this.excel.preview(
      p.workspaceId,
      Buffer.isBuffer(body) ? new Uint8Array(body) : new Uint8Array(),
    );
  }
}
