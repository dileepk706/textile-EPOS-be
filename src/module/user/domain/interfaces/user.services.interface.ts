import { CreateUserDto } from '@/module/user/application/dtos/create-user.dto.js';
import { LoginUserDto } from '@/module/user/application/dtos/login-user.dto.js';
import { UpdateUserDto } from '@/module/user/application/dtos/update-user.dto.js';
import { IUser } from '@/module/user/domain/interfaces/user.entity.interface.js';

export default interface IUserService {
  create(userData: CreateUserDto, client?: any): Promise<IUser>;
  validate(credentials: LoginUserDto): Promise<IUser>;
  findById(id: string): Promise<IUser | null>;
  findAll(filter?: Record<string, any>): Promise<IUser[]>;
  update(id: string, userData: UpdateUserDto): Promise<IUser>;
  delete(id: string): Promise<boolean>;
}
