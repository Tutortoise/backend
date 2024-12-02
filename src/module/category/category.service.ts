import { CategoryRepository } from "./category.repository";

export interface CategoryServiceDependencies {
  categoryRepository: CategoryRepository;
}

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor({ categoryRepository }: CategoryServiceDependencies) {
    this.categoryRepository = categoryRepository;
  }

  public async getAllCategories() {
    try {
      return await this.categoryRepository.getAllCategories();
    } catch (error) {
      throw new Error(`Error when getting all categories: ${error}`);
    }
  }

  public async getPopularCategories() {
    try {
      return await this.categoryRepository.getPopularCategories();
    } catch (error) {
      throw new Error(`Error when getting popular categories: ${error}`);
    }
  }

  public async getAvailableCategories(tutorId: string) {
    try {
      return await this.categoryRepository.getAvailableCategories(tutorId);
    } catch (error) {
      throw new Error(`Error when getting available categories: ${error}`);
    }
  }

  public async checkCategoryExists(categoryId: string) {
    return this.categoryRepository.checkCategoryExists(categoryId);
  }
}
