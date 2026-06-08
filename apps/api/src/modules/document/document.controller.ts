import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentService } from './document.service';
import { AddVersionDto, CreateDocumentDto, DocumentQueryDto } from './dto/document.dto';

@ApiTags('Document Management — §30')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post()
  @ApiOperation({ summary: 'Register dokumen baru' })
  create(@Body() dto: CreateDocumentDto, @CurrentUser() user: any) {
    return this.documentService.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar dokumen' })
  findAll(@CurrentUser() user: any, @Query() query: DocumentQueryDto) {
    return this.documentService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail dokumen + riwayat revisi' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentService.findOne(id, user.tenantId);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Tambah revisi dokumen baru' })
  addVersion(@Param('id') id: string, @Body() dto: AddVersionDto, @CurrentUser() user: any) {
    return this.documentService.addVersion(id, dto, user.tenantId, user.id);
  }
}
