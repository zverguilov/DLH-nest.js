import { Module } from '@nestjs/common';
import { AnswersController } from './answers.controller';
import { AnswersService } from './answers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from 'src/data/entities/answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Answer])
  ],
  controllers: [AnswersController],
  providers: [AnswersService]
})
export class AnswersModule {}
