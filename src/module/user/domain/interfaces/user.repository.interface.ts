import { IUser } from '@/module/user/domain/interfaces/user.entity.interface.js';

export default interface IUserRepository {
  create(userData: Partial<IUser>): Promise<IUser>;
  findByEmail(email: string): Promise<(IUser & { password?: string }) | null>;
  findById(id: string): Promise<IUser | null>;
  findAll(filter?: Record<string, any>): Promise<IUser[]>;
  update(id: string, userData: Partial<IUser>): Promise<IUser | null>;
  delete(id: string): Promise<boolean>;
}
