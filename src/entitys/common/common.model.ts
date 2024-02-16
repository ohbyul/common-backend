import { ApiProperty } from '@nestjs/swagger';
import sequelize from 'sequelize';
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'COMMON' })
export class COMMON extends Model {


}