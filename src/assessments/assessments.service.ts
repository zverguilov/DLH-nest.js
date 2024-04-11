import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from 'src/data/entities/assessment.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
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
        let randomQuestions = await this.questionRepository.createQueryBuilder('question')
        .leftJoinAndSelect('question.answers', 'answer')
        .where(`question.category = "${category}"`)
        .select()
        .orderBy('RAND()')
        .take(60)
        .getMany()
        
        let newAssessment = await this.assessmentRepository.createQueryBuilder()
        .insert()
        .into('assessment')
        .values({
            time_started: new Date(),
            exam_type: category
        })
        .execute()

        randomQuestions.forEach((question: Question) => {
            let newQuestionInstance = this.questionInstanceRepository.createQueryBuilder()
            .insert()
            .into('question_instance')
            .values({
                body: question.body,
                question: question.id,
                assessment: newAssessment.identifiers[0].id
            })
            .execute()
        }, this)

        return randomQuestions;
        //pull 60 random questions
        //create assessment
        //create 60 instances - question-assessment pairs
    }
}
