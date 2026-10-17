import { Router, Request, Response } from 'express';
import { container } from '@/config/container.js';
import IUserController from '@/module/user/domain/interfaces/user.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { createUserSchema } from '@/module/user/application/dtos/create-user.dto.js';
import { updateUserSchema } from '@/module/user/application/dtos/update-user.dto.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import { requireAdmin, requireManagerOrAdmin } from '@/shared/middleware/rbac.middleware.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';

const userRouter = Router();

const getController = () => container.resolve<IUserController>('IUserController');

/**
 * @swagger
 * tags:
 *   name: User Management
 *   description: User administration, profile management, and staff accounts
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: List all users/staff for the store
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role (owner, admin, manager, cashier, staff)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.get(
  '/',
  authenticate,
  requireManagerOrAdmin,
  asyncHandler((req: Request, res: Response) => getController().findAll(req, res)),
);

/**
 * @swagger
 * /api/user:
 *   post:
 *     summary: Create a new user (staff, cashier, manager, admin)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
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
 *                 example: cashier1@textileshop.com
 *               password:
 *                 type: string
 *                 example: Cashier@123
 *               name:
 *                 type: string
 *                 example: Anjali Sharma
 *               phone:
 *                 type: string
 *                 example: "+919876543211"
 *               user_type:
 *                 type: string
 *                 enum: [owner, admin, manager, cashier, staff]
 *                 example: cashier
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
userRouter.post(
  '/',
  authenticate,
  requireAdmin,
  processRequestBody(createUserSchema),
  asyncHandler((req: Request, res: Response) => getController().createUser(req, res)),
);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get currently authenticated user profile
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.get(
  '/profile',
  authenticate,
  asyncHandler((req: Request, res: Response) => getController().findOne(req, res)),
);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update currently authenticated user profile
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Name
 *               phone:
 *                 type: string
 *                 example: "+919876543299"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.put(
  '/profile',
  authenticate,
  processRequestBody(updateUserSchema),
  asyncHandler((req: Request, res: Response) => getController().updateSelf(req, res)),
);

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 */
userRouter.get(
  '/:id',
  authenticate,
  requireManagerOrAdmin,
  asyncHandler((req: Request, res: Response) => getController().findOne(req, res)),
);

/**
 * @swagger
 * /api/user/{id}:
 *   put:
 *     summary: Update user details by ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Anjali Sharma
 *               phone:
 *                 type: string
 *                 example: "+919876543211"
 *               user_type:
 *                 type: string
 *                 enum: [owner, admin, manager, cashier, staff]
 *                 example: manager
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
userRouter.put(
  '/:id',
  authenticate,
  requireAdmin,
  processRequestBody(updateUserSchema),
  asyncHandler((req: Request, res: Response) => getController().updateById(req, res)),
);

/**
 * @swagger
 * /api/user/{id}:
 *   patch:
 *     summary: Partially update user details by ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
userRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  processRequestBody(updateUserSchema),
  asyncHandler((req: Request, res: Response) => getController().updateById(req, res)),
);

/**
 * @swagger
 * /api/user/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
userRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler((req: Request, res: Response) => getController().deleteById(req, res)),
);

export const userRouteConfig: ModuleRouteConfig = {
  basePath: '/user',
  router: userRouter,
  group: 'protected',
};

export default userRouter;
