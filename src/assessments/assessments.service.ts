import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from 'src/data/entities/assessment.entity';
import { AnswersService } from 'src/answers/answers.service';
import { QuestionsService } from 'src/questions/questions.service';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { Question } from 'src/data/entities/question.entity';
import { Like, Repository } from 'typeorm';
import { CreateAssessmentDTO } from 'src/models/assessment/create-assessment.dto';
import { QuestionInstancesService } from 'src/question-instances/question-instances.service';

@Injectable()
export class AssessmentsService {
    public constructor(
        @InjectRepository(Assessment) private readonly assessmentRepository: Repository<Assessment>,
        private readonly questionsService: QuestionsService,
        private readonly questionInstanceService: QuestionInstancesService
    ) { }

    public async getRandomAssessment(category: string): Promise<Assessment> {
        let newAssessment = await this.assessmentRepository.create()
        newAssessment.time_started = new Date();
        newAssessment.exam_type = category;
        await this.assessmentRepository.save(newAssessment);

        let randomQuestionsBatch = await this.questionsService.getRandomBatch(category);
        await this.questionInstanceService.createQuestionInstances(randomQuestionsBatch, newAssessment.id);

        let fullAssessment = await this.assessmentRepository.createQueryBuilder('assessment')
        .leftJoin('assessment.question_instances', 'questionInstance')
        .leftJoin('questionInstance.question', 'question')
        .leftJoin('question.answers', 'answer')
        .select(['assessment.id', 'assessment.time_started', 'assessment.exam_type', 'questionInstance.id', 'question.id', 'question.body', 'answer.id', 'answer.body'])
        .where('assessment.id = :id', { id: newAssessment.id })
        .getOne();

        return fullAssessment;
    }
}
