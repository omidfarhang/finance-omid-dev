import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { z } from 'zod';
import type { PublicUser } from '@finance/shared';
import { CurrentUser } from '../auth/session.decorator';
import { SessionGuard } from '../auth/session.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ImportsService } from './imports.service';

const importBodySchema = z.object({
  accountId: z.uuid(),
  adapterId: z.enum(['generic_csv']),
});
type ImportBody = z.infer<typeof importBodySchema>;

@Controller('imports')
@UseGuards(SessionGuard)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('adapters')
  listAdapters() {
    return { adapters: this.importsService.listAdapters() };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async importFile(
    @CurrentUser() user: PublicUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body(new ZodValidationPipe(importBodySchema)) body: ImportBody,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    const content = file.buffer.toString('utf8');
    if (!content.trim()) {
      throw new BadRequestException('file is empty');
    }
    const result = await this.importsService.importFile({
      userId: user.id,
      accountId: body.accountId,
      adapterId: body.adapterId,
      originalFilename: file.originalname || 'upload.csv',
      content,
    });
    return result;
  }
}
