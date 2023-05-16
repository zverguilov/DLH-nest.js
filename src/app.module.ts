import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionsModule } from './questions/questions.module';
import { QuestionInstancesModule } from './question-instances/question-instances.module';
import { AnswersModule } from './answers/answers.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [QuestionsModule, QuestionInstancesModule, AnswersModule, UsersModule, ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
