import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { OpinionService } from './opinion.service';
import { CreateOpinionDto } from './dto/create-opinion.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../user/user-entity';

@Controller('opinions')
export class OpinionController {
  constructor(private readonly opinionService: OpinionService) {}

  @Post()
  create(@Body() createOpinionDto: CreateOpinionDto) {
    return this.opinionService.create(createOpinionDto);
  }

  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles([Role.ADMIN])
  @Get()
  findAll() {
    return this.opinionService.findAll();
  }

  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles([Role.ADMIN])
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.opinionService.markAsRead(id);
  }
}
