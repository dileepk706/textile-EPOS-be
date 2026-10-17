import { Request, Response } from 'express';

export default interface IUserController {
  createUser(req: Request, res: Response): Promise<any>;
  findOne(req: Request, res: Response): Promise<any>;
  findAll(req: Request, res: Response): Promise<any>;
  updateSelf(req: Request, res: Response): Promise<any>;
  updateById(req: Request, res: Response): Promise<any>;
  deleteById(req: Request, res: Response): Promise<any>;
}
