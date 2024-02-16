import { ApiProperty } from "@nestjs/swagger";
import { SearchDto } from "../base/search.dto";
import { bbsKindCode } from "./board.dto";
import { IsEnum } from "class-validator";
// import { Props } from "../base/props.dto";

export class BoardSearchDto extends SearchDto {

    @ApiProperty({ description: '게시판 종류', required: true })
    @IsEnum(bbsKindCode)
    bbsKindCd: string;
}

// export type BoardSearchDto = Props<BoardSearch>