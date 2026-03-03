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
// import { RolesGuard } from '../../auth/guards/roles.guard'; // Assuming roles guard exists
// import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('management-packages')
@UseGuards(JwtAuthGuard)
export class ManagementPackageController {
  constructor(private readonly packageService: ManagementPackageService) {}

  @Post()
  // @Roles('admin') // Restrict to admin
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
  // @Roles('admin')
  update(@Param('id') id: string, @Body() updateDto: UpdateManagementPackageDto) {
    return this.packageService.update(id, updateDto);
  }

  @Delete(':id')
  // @Roles('admin')
  remove(@Param('id') id: string) {
    return this.packageService.remove(id);
  }
}
