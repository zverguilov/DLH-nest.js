import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from 'src/data/entities/category.entity';
import { CategoryCreatedDTO } from 'src/models/category/category-created.dto';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { ASSESSMENT_QUESTIONS, EXAM_LENGTH, PASSING_GRADE } from 'src/constants';

@Injectable()
export class CategoryService {
  public constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

  public async createCategory(payload: CategoryCreatedDTO): Promise<Category> {
    try {
      const newCategory = await this.categoryRepository
        .createQueryBuilder()
        .insert()
        .into('category')
        .values({
          name: payload.name,
          exam_length: payload.exam_length || EXAM_LENGTH,
          number_of_questions: payload.number_of_questions || ASSESSMENT_QUESTIONS,
          passing_grade: payload.passing_grade || PASSING_GRADE
        })
        .execute();

      const createdCategory = await this.categoryRepository
        .createQueryBuilder('category')
        .select(['category.id', 'category.name'])
        .where('category.id = :id', { id: newCategory.identifiers[0].id })
        .getOne();

      return createdCategory;
    } catch (ex) {
      throw new CustomException(
        `Category Service error while creating category: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async getCategoryByName(name: string): Promise<Category | null> {
    try {
      const category = await this.categoryRepository
        .createQueryBuilder()
        .where('category.name = :name', { name: name })
        .getOne();

      return category;
    } catch (ex) {
      throw new CustomException(
        `Category Service error while retrieving category: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async getAllCategories(
    limit?: number,
    cursorName?: string,
    cursorId?: string,
    search?: string
  ): Promise<Category[]> {
    try {
      const qb = this.categoryRepository
        .createQueryBuilder('category')
        .select([
          'category.id',
          'category.name',
          'category.exam_length',
          'category.passing_grade',
          'category.number_of_questions',
        ])
        .orderBy('category.name', 'ASC')
        .addOrderBy('category.id', 'ASC'); // secondary key

      // Composite cursor
      if (cursorName && cursorId) {
        qb.andWhere(
          '(category.name > :cursorName OR (category.name = :cursorName AND category.id > :cursorId))',
          { cursorName, cursorId }
        );
      }

      // Optional search
      if (search) {
        qb.andWhere(
          'LOWER(category.name) LIKE :search',
          { search: `%${search.toLowerCase()}%` }
        );
      }

      if (limit) {
        qb.take(limit);
      }

      return await qb.getMany();

    } catch (ex) {
      throw new CustomException(
        `Category Service error while retrieving category: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

}
