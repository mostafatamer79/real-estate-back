import { PartialType } from '@nestjs/mapped-types';
import { CreateInfoBlockDto } from './create-info-block.dto';

export class UpdateInfoBlockDto extends PartialType(CreateInfoBlockDto) {}

