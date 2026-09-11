import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssignmentsService } from './assignments.service';
import { Assignment } from 'src/data/entities/assignment.entity';
import { createMockQueryBuilder } from 'src/test-utils/mock-query-builder';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let assignmentRepository: any;

  beforeEach(async () => {
    assignmentRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: getRepositoryToken(Assignment), useValue: assignmentRepository },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAssignments', () => {
    it('filters by category unless it is the "All" sentinel', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getAssignments('CSA');

      expect(qb.andWhere).toHaveBeenCalledWith('assignment.exam_type = :category', { category: 'CSA' });
    });

    it('does not filter by category for "All"', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getAssignments('All');

      expect(qb.andWhere).not.toHaveBeenCalledWith('assignment.exam_type = :category', { category: 'All' });
    });

    it('returns no nextCursor when fewer results than the page limit come back', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([{ id: 'a1', created_on: new Date() }]);
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAssignments(undefined, undefined, 20);

      expect(result.nextCursor).toBeNull();
    });

    it('returns an encoded nextCursor when a full page comes back, and decoding it round-trips', async () => {
      const lastItem = { id: 'a2', created_on: new Date('2026-01-01T00:00:00.000Z') };
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([{ id: 'a1', created_on: new Date() }, lastItem]);
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const firstPage = await service.getAssignments(undefined, undefined, 2);
      expect(firstPage.nextCursor).not.toBeNull();

      // Using that cursor on the next call should decode back to the same created_on/id
      // and get passed into the paging WHERE clause.
      const qb2 = createMockQueryBuilder();
      qb2.getMany.mockResolvedValue([]);
      assignmentRepository.createQueryBuilder.mockReturnValue(qb2);

      await service.getAssignments(undefined, undefined, 2, firstPage.nextCursor as string);

      expect(qb2.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('assignment.created_on <'),
        expect.objectContaining({ id: 'a2', created_on: lastItem.created_on }),
      );
    });

    it('applies a case-insensitive assignedBy filter', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getAssignments(undefined, 'Jane');

      expect(qb.andWhere).toHaveBeenCalledWith(
        'LOWER(assigned_by.full_name) LIKE LOWER(:assignedBy)',
        { assignedBy: '%Jane%' },
      );
    });
  });

  describe('createAssignment', () => {
    it('inserts the assignment and returns the new id', async () => {
      const qb = createMockQueryBuilder();
      qb.execute.mockResolvedValue({ identifiers: [{ id: 'assign1' }] });
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.createAssignment({
        exam_type: 'CSA', deadline: '2026-09-15T00:00:00.000Z', assigned_by: { id: 'admin1' },
      } as any);

      expect(qb.values).toHaveBeenCalledWith({
        exam_type: 'CSA', deadline: '2026-09-15T00:00:00.000Z', assigned_by: { id: 'admin1' },
      });
      expect(result).toBe('assign1');
    });
  });
});
