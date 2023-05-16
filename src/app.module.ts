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

@Module({
  imports: [QuestionsModule,
    QuestionInstancesModule,
    AnswersModule,
    UsersModule,
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
    })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
