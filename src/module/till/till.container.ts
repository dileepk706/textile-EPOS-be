import { DependencyContainer } from 'tsyringe';
import TillRepository from '@/module/till/infrastructure/till.repository.js';
import TillService from '@/module/till/service/till.service.js';
import TillController from '@/module/till/interfaces/controller/till.controller.js';

export default function registerTillModule(container: DependencyContainer) {
  container.registerSingleton('ITillRepository', TillRepository);
  container.registerSingleton('ITillService', TillService);
  container.registerSingleton('ITillController', TillController);
}
