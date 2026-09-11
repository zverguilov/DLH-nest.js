import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoadService } from './load.service';
import { Question } from 'src/data/entities/question.entity';
import { Answer } from 'src/data/entities/answer.entity';
import { CategoryService } from 'src/category/category.service';
import { QuestionsService } from 'src/questions/questions.service';
import { EXAM_LENGTH, ASSESSMENT_QUESTIONS, PASSING_GRADE } from 'src/constants';
import { createMockQueryBuilder } from 'src/test-utils/mock-query-builder';

let worksheetsForTest: any[] = [];

jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    xlsx: { load: jest.fn().mockResolvedValue(undefined) },
    get worksheets() { return worksheetsForTest; },
    getWorksheet: (name: string) => worksheetsForTest.find((w: any) => w.name === name),
  })),
}));

function makeWorksheet(name: string, dataRows: any[][]) {
  // Row 1 is a header the service explicitly skips; real data starts at row 2.
  const allRows = [['HEADER'], ...dataRows];
  return {
    name,
    eachRow: (cb: (row: any, rowNumber: number) => void) => {
      allRows.forEach((values, i) => cb({ values }, i + 1));
    },
  };
}

describe('LoadService', () => {
  let service: LoadService;
  let questionRepository: any;
  let answerRepository: any;
  let categoryService: any;

  beforeEach(async () => {
    worksheetsForTest = [];
    questionRepository = { create: jest.fn().mockReturnValue({}), save: jest.fn() };
    answerRepository = { createQueryBuilder: jest.fn() };
    categoryService = { getCategoryByName: jest.fn(), createCategory: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoadService,
        { provide: getRepositoryToken(Question), useValue: questionRepository },
        { provide: getRepositoryToken(Answer), useValue: answerRepository },
        { provide: CategoryService, useValue: categoryService },
        { provide: QuestionsService, useValue: {} },
      ],
    }).compile();

    service = module.get<LoadService>(LoadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a category with default settings for a sheet with no existing category', async () => {
    worksheetsForTest = [makeWorksheet('CSA', [])];
    categoryService.getCategoryByName.mockResolvedValue(null);

    await service.loadData('fake-buffer' as any);

    expect(categoryService.createCategory).toHaveBeenCalledWith({
      name: 'CSA', exam_length: EXAM_LENGTH, passing_grade: PASSING_GRADE, number_of_questions: ASSESSMENT_QUESTIONS,
    });
  });

  it('does not recreate a category that already exists for the sheet', async () => {
    worksheetsForTest = [makeWorksheet('CSA', [])];
    categoryService.getCategoryByName.mockResolvedValue({ id: 'cat1', name: 'CSA' });

    await service.loadData('fake-buffer' as any);

    expect(categoryService.createCategory).not.toHaveBeenCalled();
  });

  it('creates a question and one answer per option, with correctness taken from the comma-separated map', async () => {
    // columns: [_, idCol, body, answers "A / B / C", correctness "0,1,0", category]
    worksheetsForTest = [makeWorksheet('CSA', [
      [undefined, 1, 'What is 2+2?', 'Three / Four / Five', '0,1,0', 'CSA'],
    ])];
    categoryService.getCategoryByName.mockResolvedValue({ id: 'cat1', name: 'CSA' });
    questionRepository.save.mockResolvedValue({ id: 'q1', body: 'What is 2+2?' });
    const answerQb = createMockQueryBuilder();
    answerQb.execute.mockResolvedValue({});
    answerRepository.createQueryBuilder.mockReturnValue(answerQb);

    await service.loadData('fake-buffer' as any);

    expect(questionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      body: 'What is 2+2?', category: 'CSA',
    }));
    expect(answerQb.values).toHaveBeenCalledTimes(3);
    expect(answerQb.values).toHaveBeenNthCalledWith(1, { body: 'Three', is_correct: false, question: { id: 'q1', body: 'What is 2+2?' } });
    expect(answerQb.values).toHaveBeenNthCalledWith(2, { body: 'Four', is_correct: true, question: { id: 'q1', body: 'What is 2+2?' } });
    expect(answerQb.values).toHaveBeenNthCalledWith(3, { body: 'Five', is_correct: false, question: { id: 'q1', body: 'What is 2+2?' } });
  });

  it('continues importing remaining rows when one row fails to save (e.g. a duplicate)', async () => {
    worksheetsForTest = [makeWorksheet('CSA', [
      [undefined, 1, 'Bad question', 'A / B', '1,0', 'CSA'],
      [undefined, 2, 'Good question', 'C / D', '0,1', 'CSA'],
    ])];
    categoryService.getCategoryByName.mockResolvedValue({ id: 'cat1', name: 'CSA' });
    questionRepository.save
      .mockRejectedValueOnce(new Error('duplicate key'))
      .mockResolvedValueOnce({ id: 'q2', body: 'Good question' });
    const answerQb = createMockQueryBuilder();
    answerQb.execute.mockResolvedValue({});
    answerRepository.createQueryBuilder.mockReturnValue(answerQb);

    const result = await service.loadData('fake-buffer' as any);

    expect(questionRepository.save).toHaveBeenCalledTimes(2);
    // Only the second (successful) question's answers get inserted.
    expect(answerQb.values).toHaveBeenCalledTimes(2);
    expect(answerQb.values).toHaveBeenCalledWith(expect.objectContaining({ body: 'C', question: { id: 'q2', body: 'Good question' } }));
    expect(result).toBe('Data successfully loaded.');
  });
});
