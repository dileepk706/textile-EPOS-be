import { DependencyContainer } from 'tsyringe';
import CategoryRepository from '@/module/category/infrastructure/category.repository.js';
import CategoryService from '@/module/category/service/category.service.js';
import CategoryController from '@/module/category/interfaces/controller/category.controller.js';

export default function registerCategoryModule(container: DependencyContainer) {
  container.registerSingleton('ICategoryRepository', CategoryRepository);
  container.registerSingleton('ICategoryService', CategoryService);
  container.registerSingleton('ICategoryController', CategoryController);
}
