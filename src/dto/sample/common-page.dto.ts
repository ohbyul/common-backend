import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { OrderOptionDto } from './order-option.dto';
import { WhereOptionDto } from './where-option.dto.';

/**
 * tumor 확장 속성값 입력/수정 dto
 */
 @ApiExtraModels(
  OrderOptionDto,
  WhereOptionDto
)
//위키 페이지네이션 관련  DTO
export class CommonPageDto<T extends OrderOptionDto, WhereOptionDto> {
  @ApiProperty({
    description: '페이지 넘버(기본 : 1)',
    required: false,
    default: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 길이(기본 :  10)',
    required: false,
    default: 10,
  })
  pageLength: number;

  @ApiProperty({
    description: '검색 옵션',
    type: 'array',
    items: {
        oneOf: [
            { $ref: getSchemaPath(WhereOptionDto) },
        ],
    },
  })
  whereOptions: T[]; 

  @ApiProperty({
    description: '정렬 옵션',
    type: 'array',
    items: {
        oneOf: [
            { $ref: getSchemaPath(OrderOptionDto) },
        ],
    },
  })
  orderOptions: T[]; 
}
