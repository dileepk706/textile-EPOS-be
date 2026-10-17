import type { Request, Response, NextFunction } from 'express';

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (controller: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(controller(req, res, next)).catch(next);
  };
};

export default asyncHandler;
