import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ManagementPackageService } from './management-package.service';
import { CreateManagementPackageDto, UpdateManagementPackageDto } from './dto/create-management-package.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { SkipSubscriptionGuard } from '../../common/decorators/skip-subscription.decorator';
import { Roles } from '../../common/decorators/roles.decorators';
import { Role } from '../../user/user-entity';

@SkipSubscriptionGuard()
@Controller('management-packages')
@UseGuards(JwtAuthGuard)
export class ManagementPackageController {
  constructor(private readonly packageService: ManagementPackageService) {}

  @Post()
  @Roles([Role.ADMIN])
  create(@Body() createDto: CreateManagementPackageDto) {
    return this.packageService.create(createDto);
  }

  @Get()
  findAll() {
    return this.packageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packageService.findOne(id);
  }

  @Patch(':id')
  @Roles([Role.ADMIN])
  update(@Param('id') id: string, @Body() updateDto: UpdateManagementPackageDto) {
    return this.packageService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles([Role.ADMIN])
  remove(@Param('id') id: string) {
    return this.packageService.remove(id);
  }
}
