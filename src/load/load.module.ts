import { Module } from '@nestjs/common';
import { LoadController } from './load.controller';
import { LoadService } from './load.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/data/entities/question.entity';
import { Answer } from 'src/data/entities/answer.entity';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Question]),
    TypeOrmModule.forFeature([Answer])
],
  controllers: [LoadController],
  providers: [LoadService]
})
export class LoadModule {}
