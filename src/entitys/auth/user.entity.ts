import { ApiProperty } from '@nestjs/swagger';
import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({ tableName: 'USER' })
export class USER extends Model {
  @ApiProperty({ description: '유저 테이블' })
  @PrimaryKey
  @Column
  uuid: string;

  @Column
  username: string;

  @Column
  password: string;

  @Column
  userEmail: string;

  @Column
  phoneNumber: string;

  @Column
  acceptTerms: number;

  @Column
  acceptPrivacy: number;

  @Column
  isQuit: number;

  @Column
  quitedAt: Date;

  @Column
  isEmailConfirm: number;

  @Column
  updatedAt: Date;

  @Column
  createdAt: Date;
}
