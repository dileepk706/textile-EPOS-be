import { Router, Request, Response } from 'express';
import { container } from '@/config/container.js';
import IUserController from '@/module/user/domain/interfaces/user.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { createUserSchema } from '@/module/user/application/dtos/create-user.dto.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';
import { loginUserSchema } from '@/module/user/application/dtos/login-user.dto.js';
import IUserAuthController from '@/module/user/domain/interfaces/user.auth.controller.interface.js';

const userAuthRouter = Router();

const getController = () => container.resolve<IUserController>('IUserController');
const getAuthController = () => container.resolve<IUserAuthController>('IUserAuthController');

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User authentication and management for Textile EPOS
 */

/**
 * @swagger
 * /api/user-auth/register:
 *   post:
 *     summary: Create a new user account
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: owner@textileshop.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               role:
 *                 type: string
 *                 example: owner
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User with email already exists
 */
userAuthRouter.post(
  '/register',
  processRequestBody(createUserSchema),
  asyncHandler((req: Request, res: Response) => getController().createUser(req, res)),
);

/**
 * @swagger
 * /api/user-auth/login:
 *   post:
 *     summary: User login
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: owner@textileshop.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid email or password
 */
userAuthRouter.post(
  '/login',
  processRequestBody(loginUserSchema),
  asyncHandler((req: Request, res: Response) => getAuthController().login(req, res)),
);

/**
 * @swagger
 * /api/user-auth/logout:
 *   post:
 *     summary: Logout user and invalidate refresh token
 *     tags: [User]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
userAuthRouter.post(
  '/logout',
  asyncHandler((req: Request, res: Response) => getAuthController().logout(req, res)),
);

export const userAuthRouteConfig: ModuleRouteConfig = {
  basePath: '/user-auth',
  router: userAuthRouter,
  group: 'public',
};

export default userAuthRouter;
