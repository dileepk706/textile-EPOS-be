import { DependencyContainer } from 'tsyringe';
import UserAuthController from '@/module/user/interfaces/controller/user.auth.controller.js';
import UserController from '@/module/user/interfaces/controller/user.controller.js';
import UserService from '@/module/user/service/user.services.js';
import UserRepository from '@/module/user/infrastructure/user.repository.js';

export default function registerUserModule(container: DependencyContainer) {
  container.registerSingleton('IUserRepository', UserRepository);
  container.registerSingleton('IUserService', UserService);
  container.registerSingleton('IUserController', UserController);
  container.registerSingleton('IUserAuthController', UserAuthController);
}
