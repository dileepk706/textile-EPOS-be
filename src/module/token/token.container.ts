import { DependencyContainer } from 'tsyringe';
import TokenService from '@/module/token/application/services/token.service.js';

export default function registerTokenModule(container: DependencyContainer) {
  container.registerSingleton('ITokenService', TokenService);
}
