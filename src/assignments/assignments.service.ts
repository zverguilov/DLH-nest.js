import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from 'src/data/entities/assignment.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { CreateAssignmentDTO } from 'src/models/assignment/create-assignment.dto';

@Injectable()
export class AssignmentsService {
    public constructor(
        @InjectRepository(Assignment)
        private readonly assignmentRepository: Repository<Assignment>
    ) { }

    private encodeCursor(data: { created_on: Date; id: string }): string {
        return Buffer.from(JSON.stringify(data)).toString('base64');
    }

    private decodeCursor(cursor: string): { created_on: Date; id: string } {
        const decoded = JSON.parse(
            Buffer.from(cursor, 'base64').toString('utf-8')
        );

        return {
            created_on: new Date(decoded.created_on),
            id: decoded.id,
        };
    }

    public async getAssignments(
        category?: string,
        assignedBy?: string,
        limit: number = 20,
        cursor?: string
    ): Promise<{ data: Assignment[]; nextCursor: string | null }> {
        try {
            const query = this.assignmentRepository
                .createQueryBuilder('assignment')
                .leftJoin('assignment.assessments', 'assessment')
                .leftJoin('assessment.user', 'user')
                .leftJoin('assignment.assigned_by', 'assigned_by')
                .select([
                    'assignment.id',
                    'assignment.exam_type',
                    'assignment.created_on',
                    'assignment.deadline',
                    'assessment.id',
                    'assessment.status',
                    'assessment.grade',
                    'assessment.pass',
                    'user.id',
                    'user.full_name',
                    'assigned_by.id',
                    'assigned_by.full_name'
                ])
                .orderBy('assignment.created_on', 'DESC')
                .addOrderBy('assignment.id', 'DESC')
                .take(limit);

            if (category && category !== 'All') {
                query.andWhere('assignment.exam_type = :category', { category });
            }

            if (assignedBy) {
                query.andWhere(
                    'LOWER(assigned_by.full_name) LIKE LOWER(:assignedBy)',
                    { assignedBy: `%${assignedBy}%` }
                );
            }

            if (cursor) {
                const { created_on, id } = this.decodeCursor(cursor);

                query.andWhere(
                    `(assignment.created_on < :created_on
          OR (assignment.created_on = :created_on AND assignment.id < :id))`,
                    { created_on, id }
                );
            }

            const data = await query.getMany();

            let nextCursor: string | null = null;

            if (data.length === limit) {
                const lastItem = data[data.length - 1];

                nextCursor = this.encodeCursor({
                    created_on: lastItem.created_on,
                    id: lastItem.id,
                });
            }

            return { data, nextCursor };
        } catch (ex) {
            throw new CustomException(
                `Assignment Service error while retrieving assignments: ${ex.message}`,
                ex.statusCode,
            );
        }
    }

    public async createAssignment(payload: CreateAssignmentDTO): Promise<string> {
        try {
            const assignment = await this.assignmentRepository
                .createQueryBuilder()
                .insert()
                .into('assignment')
                .values({
                    exam_type: payload.exam_type,
                    deadline: payload.deadline,
                    assigned_by: payload.assigned_by
                })
                .execute();

            return assignment.identifiers[0].id;

        } catch (ex) {
            throw new CustomException(
                `Assignment Service error while creating assignment: ${ex.message}`,
                ex.statusCode,
            );
        }
    }
}
