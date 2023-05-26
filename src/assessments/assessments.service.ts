import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from 'src/data/entities/assessment.entity';
import { QuestionInstance } from 'src/data/entities/question-instance.entity';
import { Question } from 'src/data/entities/question.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class AssessmentsService {
    public constructor(
        @InjectRepository(Assessment) private readonly assessmentRepository: Repository<Assessment>,
        @InjectRepository(Question) private readonly questionRepository: Repository<Question>,
        @InjectRepository(QuestionInstance) private readonly questionInstanceRepository: Repository<QuestionInstance>
    ) {}

    public async getRandomAssessment(category: string) {
        let randomQuestions = await this.questionRepository.createQueryBuilder('id')
        .select()
        .orderBy('RAND()')
        .take(60)
        .getMany()

        return randomQuestions;
        //pull 60 random questions
        //create assessment
        //create 60 instances - question-assessment pairs
    }
}
