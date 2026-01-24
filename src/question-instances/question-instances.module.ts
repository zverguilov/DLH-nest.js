import { Module } from '@nestjs/common';
import { QuestionInstancesController } from './question-instances.controller';
import { QuestionInstancesService } from './question-instances.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { AnswersService } from 'src/answers/answers.service';
import { Answer } from 'src/data/entities/answer.entity';
import { PassportModule } from '@nestjs/passport';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorFilter } from 'src/middleware/filters/error.filter';
import { RemoveUnderscoreInterceptor } from 'src/middleware/interceptors/remove-underscore.interceptor';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([QuestionInstance]),
    TypeOrmModule.forFeature([Answer])
  ],
  controllers: [QuestionInstancesController],
  providers: [
    QuestionInstancesService,
    AnswersService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RemoveUnderscoreInterceptor
    }
  ]
})
export class QuestionInstancesModule {}
