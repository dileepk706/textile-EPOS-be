import { DependencyContainer } from 'tsyringe';
import TextileRepository from '@/module/textile/infrastructure/textile.repository.js';
import TextileService from '@/module/textile/service/textile.service.js';
import TextileController from '@/module/textile/interfaces/controller/textile.controller.js';

export default function registerTextileModule(container: DependencyContainer) {
  container.registerSingleton('ITextileRepository', TextileRepository);
  container.registerSingleton('ITextileService', TextileService);
  container.registerSingleton('ITextileController', TextileController);
}
