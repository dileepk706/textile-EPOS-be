import { injectable } from 'tsyringe';
import UserModel from '@/module/user/infrastructure/user.schema.js';
import IUserRepository from '@/module/user/domain/interfaces/user.repository.interface.js';
import { IUser } from '@/module/user/domain/interfaces/user.entity.interface.js';

@injectable()
export default class UserRepository implements IUserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = await UserModel.create(userData);
    const userObj = user.toJSON() as IUser;
    delete userObj.password;
    return userObj;
  }

  async findByEmail(email: string): Promise<(IUser & { password?: string }) | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) return null;
    const userObj = user.toJSON() as IUser;
    return {
      ...userObj,
      password: user.password,
    };
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await UserModel.findById(id);
    if (!user) return null;
    const userObj = user.toJSON() as IUser;
    delete userObj.password;
    return userObj;
  }

  async findAll(filter: Record<string, any> = {}): Promise<IUser[]> {
    const users = await UserModel.find(filter).sort({ createdAt: -1 });
    return users.map((u) => {
      const userObj = u.toJSON() as IUser;
      delete userObj.password;
      return userObj;
    });
  }

  async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    const updated = await UserModel.findByIdAndUpdate(id, { $set: userData }, { new: true });
    if (!updated) return null;
    const userObj = updated.toJSON() as IUser;
    delete userObj.password;
    return userObj;
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }
}
