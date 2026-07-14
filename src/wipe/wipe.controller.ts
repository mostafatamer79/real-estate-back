import { Controller, Post, UseGuards } from '@nestjs/common';
import { WipeService } from './wipe.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../user/user-entity';

@Controller('wipe')
@UseGuards(JwtAuthGuard)
export class WipeController {
  constructor(private readonly wipeService: WipeService) {}

  /**
   * Admin-only endpoint to wipe all platform data while keeping admin accounts.
   */
  @Post('all-data')
  @Roles([Role.ADMIN])
  async wipeAllData() {
    return this.wipeService.wipeAllDataExceptAdmins();
  }
}
