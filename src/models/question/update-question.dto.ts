import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { UpdateAnswerDTO } from '../answer/update-answer.dto';
import { CreateAnswerDTO } from '../answer/create-answer.dto';

export class UpdateQuestionDTO {
      @Expose()
      @IsUUID()
      id: string;

      @Expose()
      @IsOptional()
      @IsString()
      body?: string;

      @Expose()
      @IsOptional()
      @IsString()
      category?: string;

      @Expose()
      @IsOptional()
      @IsBoolean()
      is_flagged?: boolean;

      @Expose()
      @IsOptional()
      @IsArray()
      @ValidateNested({ each: true })
      @Type(() => CreateAnswerDTO)
      add_answers?: CreateAnswerDTO[];

      @Expose()
      @IsOptional()
      @IsArray()
      @ValidateNested({ each: true })
      @Type(() => UpdateAnswerDTO)
      update_answers?: UpdateAnswerDTO[];

      @Expose()
      @IsOptional()
      @IsArray()
      @IsUUID('4', { each: true })
      delete_answers?: string[];

      @Expose()
      @IsOptional()
      @IsArray()
      @IsUUID('4', { each: true })
      delete_comments?: string[];
}
