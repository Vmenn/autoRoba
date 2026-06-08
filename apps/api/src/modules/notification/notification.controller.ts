import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Ambil notifikasi saya' })
  findAll(@CurrentUser() user: any, @Query('unread') unread?: string) {
    return this.notificationService.findAll(user.id, user.tenantId, unread === 'true');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai notifikasi sudah dibaca' })
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationService.markRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tandai semua notifikasi sudah dibaca' })
  markAllRead(@CurrentUser() user: any) {
    return this.notificationService.markAllRead(user.id, user.tenantId);
  }
}
