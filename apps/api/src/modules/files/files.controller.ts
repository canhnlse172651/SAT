import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser } from '../../common/auth/decorators.js';
import { FilesService } from './files.service.js';

const INLINE_TYPES = /^(image|audio|video)\/|^application\/pdf$/;

/** `filename*` (RFC 5987) keeps non-ASCII names intact and cannot break out of the header. */
function contentDisposition(contentType: string, filename: string): string {
  const kind = INLINE_TYPES.test(contentType) ? 'inline' : 'attachment';
  return `${kind}; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get(':id')
  async download(
    @Param('id') id: string,
    @CurrentUser() principal: AuthPrincipal,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, metadata } = await this.files.open(id, principal.workspaceId);
    res.setHeader('Cache-Control', 'private');
    return new StreamableFile(stream, {
      type: metadata.contentType,
      length: metadata.size,
      disposition: contentDisposition(metadata.contentType, metadata.filename),
    });
  }
}
