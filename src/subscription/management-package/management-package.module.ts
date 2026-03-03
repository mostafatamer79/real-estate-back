import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagementPackage } from './management-package.entity';
import { ManagementPackageService } from './management-package.service';
import { ManagementPackageController } from './management-package.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ManagementPackage])],
  controllers: [ManagementPackageController],
  providers: [ManagementPackageService],
  exports: [ManagementPackageService],
})
export class ManagementPackageModule {}
