import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

enum OrderOption {
    ASC = 'ASC',
    DESC = 'DESC',
}
// 검색 기본 DTO
export class SearchDto {

    @ApiProperty({ description: '페이지 넘버(기본 : 1)', required: false, default: 1, })
    page: number;

    @ApiProperty({ description: 'Off-Set', required: false })
    offset?: number;

    @ApiProperty({ description: '페이지 길이(기본 :  10)', required: false, default: 10, })
    pageLength: number;


    @ApiProperty({ enum: ['ASC', 'DESC'], description: '정렬 옵션', required: false, })
    @IsEnum(OrderOption)
    orderType?: string;

    @ApiProperty({ description: '정렬 컬럼 명', required: false, })
    orderVaule?: string;

    @ApiProperty({ description: '검색 타입', required: false, })
    searchType?: string;

    @ApiProperty({ description: '검색 명', required: false, })
    searchVaule?: string;

}