import { Module } from '@nestjs/common';
import { QuestionInstancesController } from './question-instances.controller';
import { QuestionInstancesService } from './question-instances.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionInstance } from 'src/data/entities/question-instance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionInstance])
  ],
  controllers: [QuestionInstancesController],
  providers: [QuestionInstancesService]
})
export class QuestionInstancesModule {}
