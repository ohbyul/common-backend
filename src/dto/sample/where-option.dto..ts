import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

/**
 * 정렬컬럼과 정렬방식
 */
export class WhereOptionDto {
    @ApiProperty({description: 'where key'})
    where_key: string;

    @ApiProperty({description: 'where value'})
    where_value: string;

    @ApiProperty({description: 'where type : = / like'})
    where_type: string;
}

