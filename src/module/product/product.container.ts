import { DependencyContainer } from 'tsyringe';
import ProductRepository from '@/module/product/infrastructure/product.repository.js';
import ProductService from '@/module/product/service/product.service.js';
import ProductController from '@/module/product/interfaces/controller/product.controller.js';

export default function registerProductModule(container: DependencyContainer) {
  container.registerSingleton('IProductRepository', ProductRepository);
  container.registerSingleton('IProductService', ProductService);
  container.registerSingleton('IProductController', ProductController);
}
