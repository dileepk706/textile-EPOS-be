import { Router, Request, Response } from 'express';
import { container } from '@/config/container.js';
import IProductController from '@/module/product/domain/interfaces/product.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import { requireAdmin, requireManagerOrAdmin } from '@/shared/middleware/rbac.middleware.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { createProductSchema } from '@/module/product/application/dtos/create-product.dto.js';
import { updateProductSchema } from '@/module/product/application/dtos/update-product.dto.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';

const productRouter = Router();

const getController = () => container.resolve<IProductController>('IProductController');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog, SKU references, and barcode management for EPOS billing
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all products with real-time aggregated quantity_available
 *     description: Retrieves the product catalog. The quantity_available field is dynamically computed in real-time by aggregating available inventory from active product batches.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name, barcode, or description
 *       - in: query
 *         name: barcode
 *         schema:
 *           type: string
 *         description: Exact barcode search
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Products retrieved successfully with quantity_available
 */
productRouter.get(
  '/',
  authenticate,
  asyncHandler((req: Request, res: Response) => getController().getProducts(req, res)),
);

/**
 * @swagger
 * /api/products/barcode/{barcode}:
 *   get:
 *     summary: Lookup product by barcode (EPOS scanner)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 */
productRouter.get(
  '/barcode/:barcode',
  authenticate,
  asyncHandler((req: Request, res: Response) => getController().getProductByBarcode(req, res)),
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product reference
 *     tags: [Products]
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
 *                 example: Men Slim Fit Formal Shirt
 *               description:
 *                 type: string
 *                 example: 100% Egyptian Cotton Full Sleeve Shirt
 *               barcode:
 *                 type: string
 *                 example: "8901234567890"
 *               unit:
 *                 type: string
 *                 example: pcs
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Barcode already exists
 */
productRouter.post(
  '/',
  authenticate,
  requireManagerOrAdmin,
  processRequestBody(createProductSchema),
  asyncHandler((req: Request, res: Response) => getController().createProduct(req, res)),
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
productRouter.get(
  '/:id',
  authenticate,
  asyncHandler((req: Request, res: Response) => getController().getProductById(req, res)),
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product by ID
 *     tags: [Products]
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
 *               barcode:
 *                 type: string
 *               unit:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
productRouter.put(
  '/:id',
  authenticate,
  requireManagerOrAdmin,
  processRequestBody(updateProductSchema),
  asyncHandler((req: Request, res: Response) => getController().updateProduct(req, res)),
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Soft delete product by ID
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
productRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler((req: Request, res: Response) => getController().deleteProduct(req, res)),
);

export const productRouteConfig: ModuleRouteConfig = {
  basePath: '/products',
  router: productRouter,
  group: 'public',
};

export default productRouter;
