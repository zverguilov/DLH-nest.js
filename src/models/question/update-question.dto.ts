import { Expose } from 'class-transformer';
import { UpdateAnswerDTO } from '../answer/update-answer.dto';
import { CreateAnswerDTO } from '../answer/create-answer.dto';

export class UpdateQuestionDTO {
      @Expose()
      id: string;
  
      @Expose()
      body?: string;
  
      @Expose()
      category?: string;
  
      @Expose()
      is_flagged?: boolean;
  
      @Expose()
      add_answers?: CreateAnswerDTO[];
  
      @Expose()
      update_answers?: UpdateAnswerDTO[];
  
      @Expose()
      delete_answers?: string[];
  
      @Expose()
      comments?: Comment[];
  
      @Expose()
      delete_comments?: string[];
}
