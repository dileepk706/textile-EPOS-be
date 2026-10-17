import { DependencyContainer } from 'tsyringe';
import SupplierRepository from '@/module/supplier/infrastructure/supplier.repository.js';
import SupplierService from '@/module/supplier/service/supplier.service.js';
import SupplierController from '@/module/supplier/interfaces/controller/supplier.controller.js';

export default function registerSupplierModule(container: DependencyContainer) {
  container.registerSingleton('ISupplierRepository', SupplierRepository);
  container.registerSingleton('ISupplierService', SupplierService);
  container.registerSingleton('ISupplierController', SupplierController);
}
