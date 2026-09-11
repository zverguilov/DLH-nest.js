import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: any;

  beforeEach(async () => {
    service = {
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      getAllCategories: jest.fn(),
      getCategoryByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: service }],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createCategory delegates to the service with the body payload', async () => {
    service.createCategory.mockResolvedValue({ id: 'cat1', name: 'CSA' });
    const payload: any = { name: 'CSA' };

    const result = await controller.createCategory(payload);

    expect(service.createCategory).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ id: 'cat1', name: 'CSA' });
  });

  it('updateCategory delegates to the service with the body payload', async () => {
    service.updateCategory.mockResolvedValue('Category CSA saved successfully.');
    const payload: any = { id: 'cat1', passing_grade: 80 };

    const result = await controller.updateCategory(payload);

    expect(service.updateCategory).toHaveBeenCalledWith(payload);
    expect(result).toBe('Category CSA saved successfully.');
  });

  it('getCategoryByName delegates to the service with the name param', async () => {
    service.getCategoryByName.mockResolvedValue({ id: 'cat1', name: 'CSA' });
    await controller.getCategoryByName('CSA');
    expect(service.getCategoryByName).toHaveBeenCalledWith('CSA');
  });
});
