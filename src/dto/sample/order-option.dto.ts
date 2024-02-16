import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

/**
 * 정렬컬럼과 정렬방식
 */
export class OrderOptionDto {
    @ApiProperty({description: 'column_name'})
    column_name: string;

    @ApiProperty({description: 'ASC/DESC'})
    orderOption: string;
}

export enum OrderOptionState {
    ASC = 'ASC',
    DESC = 'DESC',
  }