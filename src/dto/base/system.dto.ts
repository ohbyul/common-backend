import { ApiProperty } from "@nestjs/swagger";
export class SystemDto {
    createLoginId: string;
    createDtm: Date;

    modifyLoginId: string;
    modifyDtm: Date;
}