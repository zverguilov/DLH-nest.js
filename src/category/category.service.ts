import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Category } from 'src/data/entities/category.entity';
import { CategoryCreatedDTO } from 'src/models/category/category-created.dto';
import { CustomException } from 'src/middleware/exception/custom-exception';

@Injectable()
export class CategoryService {
    public constructor(
        @InjectRepository(Category) private readonly categoryRepository: Repository<Category>
    ) { }

    public async createCategory(name: string): Promise<Category> {
        try {
            let newCategory = await this.categoryRepository.createQueryBuilder()
                .insert()
                .into('category')
                .values({
                    name: name
                })
                .execute()

            let createdCategory = await this.categoryRepository.createQueryBuilder('category')
                .select([
                    'category.id',
                    'category.name'
                ])
                .where('category.id = :id', { id: newCategory.identifiers[0].id })
                .getOne();

            return createdCategory;

        } catch (ex) {
            throw new CustomException(`Category Service error while creating category: ${ex.message}`, ex.statusCode)
        }

    }

    public async getCategoryByName(name: string): Promise<Category> {
        try {
            let category = await this.categoryRepository.createQueryBuilder()
                .where('category.name = :name', { name: name })
                .getOne();

            return category;

        } catch (ex) {
            throw new CustomException(`Category Service error while retrieving category: ${ex.message}`, ex.statusCode)
        }
    }
}
