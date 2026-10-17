import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { sendSuccess } from '@/shared/response_handler.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import httpStatus from 'http-status';
import IUserController from '@/module/user/domain/interfaces/user.controller.interface.js';
import IUserService from '@/module/user/domain/interfaces/user.services.interface.js';

@injectable()
class UserController implements IUserController {
  constructor(@inject('IUserService') private readonly userService: IUserService) {}

  createUser = async (req: Request, res: Response) => {
    const textileId = req.user?.textiles_id || req.user?.textile_id;
    const result = await this.userService.create({
      ...req.body,
      user_type: String(req.body.user_type || req.body.role || 'CASHIER').toUpperCase(),
      role: String(req.body.role || req.body.user_type || 'CASHIER').toUpperCase(),
      textile_id: req.body.textile_id || textileId,
      tenant_id: req.body.tenant_id || req.user?.tenant_id || textileId,
    });
    return sendSuccess(res, result, 'User created successfully', httpStatus.CREATED);
  };

  findOne = async (req: Request, res: Response) => {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = paramId || req.user?.user_id;
    if (!userId) {
      throw new ApiError('User ID required', httpStatus.BAD_REQUEST);
    }
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ApiError('User not found', httpStatus.NOT_FOUND);
    }
    return sendSuccess(res, user, 'User details retrieved successfully', httpStatus.OK);
  };

  findAll = async (req: Request, res: Response) => {
    const filter: Record<string, any> = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.user_type) filter.user_type = req.query.user_type;
    if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === 'true';

    const textileId = req.user?.textiles_id || req.user?.textile_id;
    if (textileId) {
      filter.textile_id = textileId;
    }

    const users = await this.userService.findAll(filter);
    return sendSuccess(res, users, 'Users retrieved successfully', httpStatus.OK);
  };

  updateSelf = async (req: Request, res: Response) => {
    const userId = req.user?.user_id;
    if (!userId) {
      throw new ApiError('Unauthorized', httpStatus.UNAUTHORIZED);
    }
    const user = await this.userService.update(userId, req.body);
    return sendSuccess(res, user, 'Profile updated successfully', httpStatus.OK);
  };

  updateById = async (req: Request, res: Response) => {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = paramId || req.user?.user_id;
    if (!userId) {
      throw new ApiError('User ID required', httpStatus.BAD_REQUEST);
    }
    const user = await this.userService.update(userId, req.body);
    return sendSuccess(res, user, 'User updated successfully', httpStatus.OK);
  };

  deleteById = async (req: Request, res: Response) => {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!paramId) {
      throw new ApiError('User ID required', httpStatus.BAD_REQUEST);
    }
    if (paramId == req.user.user_id)
      throw new ApiError('You cant remove yourself from staff profile', httpStatus.BAD_REQUEST);

    await this.userService.delete(paramId);
    return sendSuccess(res, {}, 'User deleted successfully', httpStatus.OK);
  };
}

export default UserController;
