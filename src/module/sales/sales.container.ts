import { DependencyContainer } from 'tsyringe';
import ISalesRepository from '@/module/sales/domain/interfaces/sales.repository.interface.js';
import SalesRepository from '@/module/sales/infrastructure/sales.repository.js';
import ISalesService from '@/module/sales/domain/interfaces/sales.service.interface.js';
import SalesService from '@/module/sales/service/sales.service.js';
import ISalesController from '@/module/sales/domain/interfaces/sales.controller.interface.js';
import SalesController from '@/module/sales/interfaces/controller/sales.controller.js';

export default function registerSalesModule(container: DependencyContainer): void {
  container.register<ISalesRepository>('ISalesRepository', {
    useClass: SalesRepository,
  });

  container.register<ISalesService>('ISalesService', {
    useClass: SalesService,
  });

  container.register<ISalesController>('ISalesController', {
    useClass: SalesController,
  });
}
