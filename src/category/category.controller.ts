import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from '@nestjs/passport';
import { StateGuard } from 'src/middleware/guards/state.guard';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { Category } from 'src/data/entities/category.entity';
import { CategoryCreatedDTO } from 'src/models/category/category-created.dto';
import { GetCategoryDTO } from 'src/models/category/get-category.dto';

@Controller('api/v1')
export class CategoryController {
  public constructor(private readonly categoryService: CategoryService) { }

  @Post('category')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async createCategory(
    @Body() payload: CategoryCreatedDTO,
  ): Promise<Category> {
    return this.categoryService.createCategory(payload);
  }

  @Put('category')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async updateCategory(@Body() categoryInfo: Category): Promise<string> {
    return this.categoryService.updateCategory(categoryInfo);
  }

  @Get('category')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async getAllCategories(): Promise<GetCategoryDTO[]> {
    return this.categoryService.getAllCategories();
  }

  @Get('category/:name')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async getCategoryByName(
    @Param('name') name: string,
  ): Promise<Category> {
    return this.categoryService.getCategoryByName(name);
  }

  @Post('category/reconcile-missing')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async reconcileMissingCategories(): Promise<string[]> {
    return this.categoryService.reconcileMissingCategories();
  }
}
