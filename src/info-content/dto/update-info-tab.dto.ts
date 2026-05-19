import { PartialType } from '@nestjs/mapped-types';
import { CreateInfoTabDto } from './create-info-tab.dto';

export class UpdateInfoTabDto extends PartialType(CreateInfoTabDto) {}

