import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AssessmentsService } from './assessments.service';
import { Assessment } from 'src/data/entities/assessment.entity';
import { Category } from 'src/data/entities/category.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { QuestionInstancesService } from 'src/question-instances/question-instances.service';
import { AuthService } from 'src/auth/auth/auth.service';
import { AssignmentsService } from 'src/assignments/assignments.service';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { createMockQueryBuilder } from 'src/test-utils/mock-query-builder';

describe('AssessmentsService', () => {
  let service: AssessmentsService;
  let assessmentRepository: any;
  let categoryRepository: any;
  let questionInstanceService: any;

  const OWNER_ID = 'owner-uuid';
  const OTHER_ID = 'other-uuid';

  beforeEach(async () => {
    assessmentRepository = { findOne: jest.fn(), update: jest.fn(), find: jest.fn(), createQueryBuilder: jest.fn() };
    categoryRepository = { createQueryBuilder: jest.fn() };
    questionInstanceService = { getQIStatus: jest.fn(), createQuestionInstances: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        { provide: DataSource, useValue: {} },
        { provide: getRepositoryToken(Assessment), useValue: assessmentRepository },
        { provide: getRepositoryToken(Category), useValue: categoryRepository },
        { provide: QuestionsService, useValue: {} },
        { provide: QuestionInstancesService, useValue: questionInstanceService },
        { provide: AuthService, useValue: {} },
        { provide: AssignmentsService, useValue: {} },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitAssessment', () => {
    const mockCategoryLookup = (category: any) => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(category);
      categoryRepository.createQueryBuilder.mockReturnValue(qb);
    };

    it('rejects when the assessment belongs to a different user', async () => {
      assessmentRepository.findOne.mockResolvedValue({ id: 'a1', exam_type: 'CSA', user: { id: OTHER_ID } });

      await expect(service.submitAssessment('a1', OWNER_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(assessmentRepository.update).not.toHaveBeenCalled();
    });

    it('grades against the actual number of question instances for this assessment, not a hardcoded 60', async () => {
      // A category configured with only 40 questions - the historical bug divided by 60 regardless.
      assessmentRepository.findOne
        .mockResolvedValueOnce({ id: 'a1', exam_type: 'CSA', user: { id: OWNER_ID } })
        .mockResolvedValueOnce({ id: 'a1', grade: 87.5 });
      mockCategoryLookup({ passing_grade: 80 });
      // 35 correct out of 40 total instances actually created for this assessment.
      questionInstanceService.getQIStatus.mockResolvedValue([
        ...Array(35).fill({ is_correct: true }),
        ...Array(5).fill({ is_correct: false }),
      ]);

      await service.submitAssessment('a1', OWNER_ID);

      const [, updatePayload] = assessmentRepository.update.mock.calls[0];
      expect(updatePayload.grade).toBeCloseTo(87.5, 5); // 35/40, not 35/60 (58.33)
      expect(updatePayload.pass).toBe(true); // 87.5 >= 80
    });

    it('does not divide by zero when an assessment has no question instances', async () => {
      assessmentRepository.findOne
        .mockResolvedValueOnce({ id: 'a1', exam_type: 'CSA', user: { id: OWNER_ID } })
        .mockResolvedValueOnce({ id: 'a1' });
      mockCategoryLookup({ passing_grade: 80 });
      questionInstanceService.getQIStatus.mockResolvedValue([]);

      await service.submitAssessment('a1', OWNER_ID);

      const [, updatePayload] = assessmentRepository.update.mock.calls[0];
      expect(updatePayload.grade).toBe(0);
      expect(Number.isNaN(updatePayload.grade)).toBe(false);
      expect(updatePayload.pass).toBe(false);
    });

    it('falls back to the default passing grade when the category has none configured', async () => {
      assessmentRepository.findOne
        .mockResolvedValueOnce({ id: 'a1', exam_type: 'Unknown', user: { id: OWNER_ID } })
        .mockResolvedValueOnce({ id: 'a1' });
      mockCategoryLookup(null);
      questionInstanceService.getQIStatus.mockResolvedValue([
        ...Array(80).fill({ is_correct: true }),
        ...Array(20).fill({ is_correct: false }),
      ]);

      await service.submitAssessment('a1', OWNER_ID);

      const [, updatePayload] = assessmentRepository.update.mock.calls[0];
      expect(updatePayload.grade).toBeCloseTo(80, 5);
      expect(updatePayload.pass).toBe(true); // meets the default PASSING_GRADE of 80
    });
  });

  describe('startAssignedAssessment', () => {
    it('rejects when the assessment belongs to a different user', async () => {
      assessmentRepository.findOne.mockResolvedValue({ id: 'a1', is_assigned: true, user: { id: OTHER_ID } });

      await expect(service.startAssignedAssessment('a1', OWNER_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(assessmentRepository.update).not.toHaveBeenCalled();
    });

    it('rejects starting a non-assigned (training) assessment through this method', async () => {
      assessmentRepository.findOne.mockResolvedValue({ id: 'a1', is_assigned: false, user: { id: OWNER_ID } });

      await expect(service.startAssignedAssessment('a1', OWNER_ID)).rejects.toThrow(CustomException);
      expect(assessmentRepository.update).not.toHaveBeenCalled();
    });

    it('rejects starting an already-started assigned assessment', async () => {
      assessmentRepository.findOne.mockResolvedValue({
        id: 'a1', is_assigned: true, time_started: new Date(), user: { id: OWNER_ID },
      });

      await expect(service.startAssignedAssessment('a1', OWNER_ID)).rejects.toThrow(CustomException);
      expect(assessmentRepository.update).not.toHaveBeenCalled();
    });

    it('starts a fresh assigned assessment owned by the requester', async () => {
      assessmentRepository.findOne
        .mockResolvedValueOnce({ id: 'a1', is_assigned: true, time_started: null, user: { id: OWNER_ID } })
        .mockResolvedValueOnce({ id: 'a1', time_started: new Date() });

      await service.startAssignedAssessment('a1', OWNER_ID);

      expect(assessmentRepository.update).toHaveBeenCalledWith('a1', expect.objectContaining({ time_started: expect.any(Date) }));
    });
  });

  describe('getOverviewStats', () => {
    it('splits results by is_assigned and returns zeroed stats for a group with no attempts', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { is_assigned: 1, total_attempts: '10', avg_score: '75.5', pass_rate: '60' },
      ]);
      assessmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getOverviewStats();

      expect(result.assigned).toEqual({ totalAttempts: 10, avgScore: 75.5, passRate: 60 });
      expect(result.training).toEqual({ totalAttempts: 0, avgScore: 0, passRate: 0 });
    });

    it('filters to assessments started within the window and excludes never-started ones', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([]);
      assessmentRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getOverviewStats();

      expect(qb.where).toHaveBeenCalledWith('assessment.time_started IS NOT NULL');
      expect(qb.andWhere).toHaveBeenCalledWith('assessment.time_started >= :sixMonthsAgo', expect.objectContaining({ sixMonthsAgo: expect.any(Date) }));
    });
  });
});
