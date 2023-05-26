import { Module } from '@nestjs/common';
import { LoadController } from './load.controller';
import { LoadService } from './load.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/data/entities/question.entity';
import { Answer } from 'src/data/entities/answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question]),
    TypeOrmModule.forFeature([Answer])
],
  controllers: [LoadController],
  providers: [LoadService]
})
export class LoadModule {}
