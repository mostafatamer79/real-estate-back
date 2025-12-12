import { Type } from "class-transformer";
import { isInt, IsOptional,Max,Min ,IsInt} from "class-validator";

export class PagninationParams{
    @IsOptional()
    @Type(()=>Number)
    @IsInt()
    @Max(10000)
    @Min(1)
    limit:number = 10

    @IsOptional()
    @Type(()=>Number)
    @IsInt()
    offset :number = 0
}