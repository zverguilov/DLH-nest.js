import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from '@nestjs/passport';
import { StateGuard } from 'src/middleware/guards/state.guard';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { Category } from 'src/data/entities/category.entity';
import { CategoryCreatedDTO } from 'src/models/category/category-created.dto';

@Controller('api/v1')
export class CategoryController {
    public constructor (
        private readonly categoryService: CategoryService
    ) {}

    @Post('category')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async createCategory(@Body() payload: CategoryCreatedDTO): Promise<Category> {
        return this.categoryService.createCategory(payload);
    }
}
