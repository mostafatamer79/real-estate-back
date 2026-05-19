import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../user/user-entity';
import { InfoContentService } from './info-content.service';
import { CreateInfoTabDto } from './dto/create-info-tab.dto';
import { UpdateInfoTabDto } from './dto/update-info-tab.dto';
import { CreateInfoBlockDto } from './dto/create-info-block.dto';
import { UpdateInfoBlockDto } from './dto/update-info-block.dto';
import { ReorderDto } from './dto/reorder.dto';

@Controller('info-content')
export class InfoContentController {
  constructor(private readonly service: InfoContentService) {}

  @Public()
  @Get()
  async getAll() {
    const data = await this.service.getAll();
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Post('reset-defaults')
  async resetDefaults() {
    const data = await this.service.resetDefaults();
    return { success: true, data };
  }

  // Tabs
  @Roles([Role.ADMIN])
  @Post('tabs')
  async createTab(@Body() dto: CreateInfoTabDto) {
    const data = await this.service.createTab(dto);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Patch('tabs/:id')
  async updateTab(@Param('id') id: string, @Body() dto: UpdateInfoTabDto) {
    const data = await this.service.updateTab(id, dto);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Delete('tabs/:id')
  async deleteTab(@Param('id') id: string) {
    await this.service.deleteTab(id);
    return { success: true };
  }

  @Roles([Role.ADMIN])
  @Post('tabs/reorder')
  async reorderTabs(@Body() dto: ReorderDto) {
    const data = await this.service.reorderTabs(dto.ids || []);
    return { success: true, data };
  }

  // Blocks
  @Roles([Role.ADMIN])
  @Post('blocks')
  async createBlock(@Body() dto: CreateInfoBlockDto) {
    const data = await this.service.createBlock(dto);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Patch('blocks/:id')
  async updateBlock(@Param('id') id: string, @Body() dto: UpdateInfoBlockDto) {
    const data = await this.service.updateBlock(id, dto);
    return { success: true, data };
  }

  @Roles([Role.ADMIN])
  @Delete('blocks/:id')
  async deleteBlock(@Param('id') id: string) {
    await this.service.deleteBlock(id);
    return { success: true };
  }

  @Roles([Role.ADMIN])
  @Post('blocks/reorder/:tabId')
  async reorderBlocks(@Param('tabId') tabId: string, @Body() dto: ReorderDto) {
    const data = await this.service.reorderBlocks(tabId, dto.ids || []);
    return { success: true, data };
  }
}

