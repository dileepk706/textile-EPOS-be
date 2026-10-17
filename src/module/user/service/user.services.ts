import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';
import { hashPassword, comparePassword } from '@/utils/hash.util.js';
import IUserRepository from '@/module/user/domain/interfaces/user.repository.interface.js';
import IUserService from '@/module/user/domain/interfaces/user.services.interface.js';
import { CreateUserDto } from '@/module/user/application/dtos/create-user.dto.js';
import { LoginUserDto } from '@/module/user/application/dtos/login-user.dto.js';
import { UpdateUserDto } from '@/module/user/application/dtos/update-user.dto.js';
import { IUser } from '@/module/user/domain/interfaces/user.entity.interface.js';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';

@injectable()
class UserService implements IUserService {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  create = async (userData: CreateUserDto, _client?: any): Promise<IUser> => {
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) {
      throw new ApiError('User with this email already exists', httpStatus.CONFLICT);
    }

    const hashedPassword = await hashPassword(userData.password);

    let textileId = userData.textile_id || null;
    let tenantId = userData.tenant_id || null;

    // Single-tenant mode fallback: assign to the active default textile if not specified
    if (!textileId) {
      const defaultTextile = await TextileModel.findOne({ is_active: true });
      if (defaultTextile) {
        textileId = defaultTextile._id ? defaultTextile._id.toString() : defaultTextile.id;
        tenantId = tenantId || textileId;
      }
    }

    const userToSave: Partial<IUser> = {
      ...userData,
      password: hashedPassword,
      role: userData.role || userData.user_type || 'staff',
      user_type: userData.user_type || userData.role || 'staff',
      tenant_id: tenantId,
      textile_id: textileId,
      is_active: true,
    };

    const createdUser = await this.userRepository.create(userToSave);
    return createdUser;
  };

  validate = async (credentials: LoginUserDto): Promise<IUser> => {
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user || !user.password) {
      throw new ApiError('Invalid email or password', httpStatus.UNAUTHORIZED);
    }

    if (user.is_active === false) {
      throw new ApiError('Your account has been deactivated', httpStatus.FORBIDDEN);
    }

    const isMatch = await comparePassword(credentials.password, user.password);
    if (!isMatch) {
      throw new ApiError('Invalid email or password', httpStatus.UNAUTHORIZED);
    }

    const cleanUser = { ...user };
    delete cleanUser.password;
    return cleanUser;
  };

  findById = async (id: string): Promise<IUser | null> => {
    return this.userRepository.findById(id);
  };

  findAll = async (filter: Record<string, any> = {}): Promise<IUser[]> => {
    return this.userRepository.findAll(filter);
  };

  update = async (id: string, userData: UpdateUserDto): Promise<IUser> => {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new ApiError(`User with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    if (userData.email && userData.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailConflict = await this.userRepository.findByEmail(userData.email);
      if (emailConflict && emailConflict.id !== id) {
        throw new ApiError('User with this email already exists', httpStatus.CONFLICT);
      }
    }

    const updatePayload: Partial<IUser> = {
      ...userData,
    };

    if (userData.password) {
      updatePayload.password = await hashPassword(userData.password);
    }

    if (userData.user_type && !userData.role) {
      updatePayload.role = userData.user_type;
    }
    if (userData.role && !userData.user_type) {
      updatePayload.user_type = userData.role;
    }

    const updated = await this.userRepository.update(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to update user', httpStatus.INTERNAL_SERVER_ERROR);
    }

    return updated;
  };

  delete = async (id: string): Promise<boolean> => {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new ApiError(`User with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    return this.userRepository.delete(id);
  };
}

export default UserService;
