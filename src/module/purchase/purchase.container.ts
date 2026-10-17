import { DependencyContainer } from 'tsyringe';
import PurchaseRepository from '@/module/purchase/infrastructure/purchase.repository.js';
import PurchaseService from '@/module/purchase/service/purchase.service.js';
import PurchaseController from '@/module/purchase/interfaces/controller/purchase.controller.js';

export default function registerPurchaseModule(container: DependencyContainer) {
  container.registerSingleton('IPurchaseRepository', PurchaseRepository);
  container.registerSingleton('IPurchaseService', PurchaseService);
  container.registerSingleton('IPurchaseController', PurchaseController);
}
