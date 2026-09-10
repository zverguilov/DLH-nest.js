import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Assignment } from './data/entities/assignment.entity';
import { Assessment } from './data/entities/assessment.entity';
import { Answer } from './data/entities/answer.entity';
import { Category } from './data/entities/category.entity';
import { Comment } from './data/entities/comment.entity';
import { Question } from './data/entities/question.entity';
import { QuestionInstance } from './data/entities/question_instance.entity';
import { User } from './data/entities/user.entity';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: 'localhost',  
    port: 3308, 
    username: 'admin',  
    password: 'admin', 
    database: 'snowmandb',  
    synchronize: false, 
    logging: false,
    entities: ['src/**/*.entity.ts'],   
    migrations: ['src/migrations/*.ts'], 
    subscribers: [],
});