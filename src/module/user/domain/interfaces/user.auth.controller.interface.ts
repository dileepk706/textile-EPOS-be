import { Request, Response } from 'express';

export default interface IUserAuthController {
  login(req: Request, res: Response): Promise<any>;
  logout(req: Request, res: Response): Promise<any>;
}
