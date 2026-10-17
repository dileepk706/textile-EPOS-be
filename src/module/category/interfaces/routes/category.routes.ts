import { Router, Request, Response } from 'express';
import { container } from '@/config/container.js';
import ICategoryController from '@/module/category/domain/interfaces/category.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import { requireAdmin, requireManagerOrAdmin } from '@/shared/middleware/rbac.middleware.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { createCategorySchema } from '@/module/category/application/dtos/create-category.dto.js';
import { updateCategorySchema } from '@/module/category/application/dtos/update-category.dto.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';

const categoryRouter = Router();

const getController = () => container.resolve<ICategoryController>('ICategoryController');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category classification and taxonomy
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List all product categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search category name
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter active categories
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
categoryRouter.get(
  '/',
  authenticate,
  asyncHandler((req: Request, res: Response) => getController().getCategories(req, res)),
);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new product category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Silk Sarees
 *               description:
 *                 type: string
 *                 example: Pure Kanjeevaram and Banarasi silk sarees
 *               code:
 *                 type: string
 *                 example: SILK
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Category with name already exists
 */
categoryRouter.post(
  '/',
  authenticate,
  requireManagerOrAdmin,
  processRequestBody(createCategorySchema),
  asyncHandler((req: Request, res: Response) => getController().createCategory(req, res)),
);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
categoryRouter.get(
  '/:id',
  authenticate,
  asyncHandler((req: Request, res: Response) => getController().getCategoryById(req, res)),
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category by ID
 *     tags: [Categories]
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
 *               description:
 *                 type: string
 *               code:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
categoryRouter.put(
  '/:id',
  authenticate,
  requireManagerOrAdmin,
  processRequestBody(updateCategorySchema),
  asyncHandler((req: Request, res: Response) => getController().updateCategory(req, res)),
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category by ID
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
categoryRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler((req: Request, res: Response) => getController().deleteCategory(req, res)),
);

export const categoryRouteConfig: ModuleRouteConfig = {
  basePath: '/categories',
  router: categoryRouter,
  group: 'public',
};

export default categoryRouter;
