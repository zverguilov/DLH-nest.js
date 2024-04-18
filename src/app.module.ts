import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionsModule } from './questions/questions.module';
import { QuestionInstancesModule } from './question-instances/question-instances.module';
import { AnswersModule } from './answers/answers.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from './config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config/config.service';
import { LoadModule } from './load/load.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { CommentsModule } from './comments/comments.module';
import { AuthService } from './auth/auth/auth.service';
import { AuthModule } from './auth/auth/auth.module';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './middleware/filters/error.filter';

@Module({
  imports: [
    AuthModule,
    AssessmentsModule,
    QuestionsModule,
    QuestionInstancesModule,
    AnswersModule,
    UsersModule,
    CommentsModule,
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: configService.dbType as any,
        host: configService.dbHost,
        port: configService.dbPort,
        username: configService.dbUsername,
        password: configService.dbPassword,
        database: configService.dbName,
        synchronize: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}']
      })
    }),
    LoadModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ErrorFilter
    }
  ],
})
export class AppModule {}
