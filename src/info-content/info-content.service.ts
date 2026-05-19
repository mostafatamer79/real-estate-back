import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InfoTab } from './entities/info-tab.entity';
import { InfoBlock } from './entities/info-block.entity';
import { DEFAULT_INFO_BLOCKS, DEFAULT_INFO_TABS } from './default-info-content';
import { CreateInfoTabDto } from './dto/create-info-tab.dto';
import { UpdateInfoTabDto } from './dto/update-info-tab.dto';
import { CreateInfoBlockDto } from './dto/create-info-block.dto';
import { UpdateInfoBlockDto } from './dto/update-info-block.dto';

@Injectable()
export class InfoContentService implements OnModuleInit {
  constructor(
    @InjectRepository(InfoTab) private readonly tabsRepo: Repository<InfoTab>,
    @InjectRepository(InfoBlock) private readonly blocksRepo: Repository<InfoBlock>,
  ) {}

  async onModuleInit() {
    await this.ensureSeeded();
  }

  private async ensureSeeded() {
    const [tabCount, blockCount] = await Promise.all([
      this.tabsRepo.count(),
      this.blocksRepo.count(),
    ]);
    if (tabCount > 0 && blockCount > 0) return;
    await this.seedDefaults();
  }

  private async seedDefaults() {
    const existingTabs = await this.tabsRepo.find();
    const byKey = new Map<string, InfoTab>();

    for (const def of DEFAULT_INFO_TABS) {
      const match = existingTabs.find((t) => t.key === def.key);
      const tab = match
        ? match
        : await this.tabsRepo.save(
            this.tabsRepo.create({
              key: def.key,
              titleAr: def.titleAr,
              titleEn: def.titleEn,
              sortOrder: def.sortOrder ?? 0,
            }),
          );
      byKey.set(def.key, tab);
    }

    const blocks = DEFAULT_INFO_BLOCKS.map((b) => {
      const tab = byKey.get(b.tabKey)!;
      return this.blocksRepo.create({
        tabId: tab.id,
        labelAr: b.labelAr,
        labelEn: b.labelEn,
        textAr: b.textAr,
        textEn: b.textEn,
        sortOrder: b.sortOrder ?? 0,
      });
    });

    await this.blocksRepo.save(blocks);
  }

  async resetDefaults() {
    await this.blocksRepo.clear();
    await this.tabsRepo.clear();
    await this.seedDefaults();
    return this.getAll();
  }

  async getAll() {
    await this.ensureSeeded();
    const tabs = await this.tabsRepo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    const tabIds = tabs.map((t) => t.id);
    const blocks = tabIds.length
      ? await this.blocksRepo.find({ where: { tabId: In(tabIds) }, order: { sortOrder: 'ASC', createdAt: 'ASC' } })
      : [];
    return { tabs, blocks };
  }

  // Tabs CRUD
  async createTab(dto: CreateInfoTabDto) {
    const item = this.tabsRepo.create({ ...dto, sortOrder: dto.sortOrder ?? 0 });
    return this.tabsRepo.save(item);
  }

  async updateTab(id: string, dto: UpdateInfoTabDto) {
    const item = await this.tabsRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Tab not found');
    Object.assign(item, dto);
    return this.tabsRepo.save(item);
  }

  async deleteTab(id: string) {
    const item = await this.tabsRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Tab not found');
    await this.tabsRepo.remove(item);
  }

  async reorderTabs(ids: string[]) {
    const items = await this.tabsRepo.find({ where: { id: In(ids) } });
    const byId = new Map(items.map((i) => [i.id, i]));
    const updates: InfoTab[] = [];
    ids.forEach((id, idx) => {
      const it = byId.get(id);
      if (!it) return;
      it.sortOrder = (idx + 1) * 10;
      updates.push(it);
    });
    await this.tabsRepo.save(updates);
    return this.getAll();
  }

  // Blocks CRUD
  async createBlock(dto: CreateInfoBlockDto) {
    const item = this.blocksRepo.create({ ...dto, sortOrder: dto.sortOrder ?? 0 });
    return this.blocksRepo.save(item);
  }

  async updateBlock(id: string, dto: UpdateInfoBlockDto) {
    const item = await this.blocksRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Block not found');
    Object.assign(item, dto);
    return this.blocksRepo.save(item);
  }

  async deleteBlock(id: string) {
    const item = await this.blocksRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Block not found');
    await this.blocksRepo.remove(item);
  }

  async reorderBlocks(tabId: string, ids: string[]) {
    const items = await this.blocksRepo.find({ where: { id: In(ids), tabId } });
    const byId = new Map(items.map((i) => [i.id, i]));
    const updates: InfoBlock[] = [];
    ids.forEach((id, idx) => {
      const it = byId.get(id);
      if (!it) return;
      it.sortOrder = (idx + 1) * 10;
      updates.push(it);
    });
    await this.blocksRepo.save(updates);
    return this.getAll();
  }
}

