import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { Category } from 'src/data/entities/category.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { ASSESSMENT_QUESTIONS, EXAM_LENGTH, PASSING_GRADE } from 'src/constants';
import { createMockQueryBuilder, mockCreateQueryBuilderSequence } from 'src/test-utils/mock-query-builder';

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: any;
  let questionsService: any;

  beforeEach(async () => {
    categoryRepository = { createQueryBuilder: jest.fn(), findOneOrFail: jest.fn(), update: jest.fn() };
    questionsService = { getTotalQuestions: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: getRepositoryToken(Category), useValue: categoryRepository },
        { provide: QuestionsService, useValue: questionsService },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('applies the provided values', async () => {
      const insertQb = createMockQueryBuilder();
      insertQb.execute.mockResolvedValue({ identifiers: [{ id: 'cat1' }] });
      const selectQb = createMockQueryBuilder();
      selectQb.getOne.mockResolvedValue({ id: 'cat1', name: 'CSA' });
      mockCreateQueryBuilderSequence(categoryRepository, insertQb, selectQb);

      await service.createCategory({ name: 'CSA', exam_length: 45, number_of_questions: 40, passing_grade: 70 } as any);

      expect(insertQb.values).toHaveBeenCalledWith({
        name: 'CSA', exam_length: 45, number_of_questions: 40, passing_grade: 70,
      });
    });

    it('falls back to the app defaults for any field left unset', async () => {
      const insertQb = createMockQueryBuilder();
      insertQb.execute.mockResolvedValue({ identifiers: [{ id: 'cat1' }] });
      const selectQb = createMockQueryBuilder();
      selectQb.getOne.mockResolvedValue({ id: 'cat1', name: 'HR' });
      mockCreateQueryBuilderSequence(categoryRepository, insertQb, selectQb);

      await service.createCategory({ name: 'HR' } as any);

      expect(insertQb.values).toHaveBeenCalledWith({
        name: 'HR', exam_length: EXAM_LENGTH, number_of_questions: ASSESSMENT_QUESTIONS, passing_grade: PASSING_GRADE,
      });
    });
  });

  describe('updateCategory', () => {
    it('applies new values when provided', async () => {
      categoryRepository.findOneOrFail.mockResolvedValue({
        id: 'cat1', name: 'CSA', exam_length: 90, number_of_questions: 60, passing_grade: 75,
      });

      await service.updateCategory({
        id: 'cat1', name: 'CSA', exam_length: 60, number_of_questions: 40, passing_grade: 80,
      } as any);

      expect(categoryRepository.update).toHaveBeenCalledWith(
        { id: 'cat1' },
        { name: 'CSA', number_of_questions: 40, passing_grade: 80, exam_length: 60 },
      );
    });

    it('falls back to the existing value for any field left unset (partial update)', async () => {
      categoryRepository.findOneOrFail.mockResolvedValue({
        id: 'cat1', name: 'CSA', exam_length: 90, number_of_questions: 60, passing_grade: 75,
      });

      // Only passing_grade changes - matches the frontend's single-field-patch pattern.
      await service.updateCategory({ id: 'cat1', passing_grade: 80 } as any);

      expect(categoryRepository.update).toHaveBeenCalledWith(
        { id: 'cat1' },
        { name: 'CSA', number_of_questions: 60, passing_grade: 80, exam_length: 90 },
      );
    });
  });

  describe('getAllCategories', () => {
    it('attaches total_questions per category from QuestionsService', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([{ id: 'cat1', name: 'CSA' }]);
      categoryRepository.createQueryBuilder.mockReturnValue(qb);
      questionsService.getTotalQuestions.mockResolvedValue(120);

      const result = await service.getAllCategories();

      expect(questionsService.getTotalQuestions).toHaveBeenCalledWith('CSA');
      expect(result).toEqual([{ id: 'cat1', name: 'CSA', total_questions: 120 }]);
    });

    it('applies the composite name/id cursor when both are given', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      categoryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getAllCategories(undefined, 'CSA', 'cat1');

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(category.name > :cursorName OR (category.name = :cursorName AND category.id > :cursorId))',
        { cursorName: 'CSA', cursorId: 'cat1' },
      );
    });
  });

  describe('getCategoryByName', () => {
    it('returns null when no category matches', async () => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(null);
      categoryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getCategoryByName('Nonexistent');

      expect(result).toBeNull();
    });
  });
});
