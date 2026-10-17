import { Router, Request, Response } from 'express';
import { container } from '@/config/container.js';
import ISupplierController from '@/module/supplier/domain/interfaces/supplier.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import {
  requireAdmin,
  requireManagerOrAdmin,
  requireStaff,
} from '@/shared/middleware/rbac.middleware.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { createSupplierSchema } from '@/module/supplier/application/dtos/create-supplier.dto.js';
import { updateSupplierSchema } from '@/module/supplier/application/dtos/update-supplier.dto.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';

const supplierRouter = Router();

const getController = () => container.resolve<ISupplierController>('ISupplierController');

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier and vendor management for textile procurement and inventory
 */

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: List all suppliers
 *     tags: [Suppliers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by supplier name, phone, email, contact person, or GSTIN
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
 */
supplierRouter.get(
  '/',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getSuppliers(req, res)),
);

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
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
 *                 example: Surat Weaving Mills Pvt Ltd
 *               contact_person:
 *                 type: string
 *                 example: Rajesh Patel
 *               phone:
 *                 type: string
 *                 example: "+91 9876543210"
 *               email:
 *                 type: string
 *                 example: sales@suratweaving.com
 *               address:
 *                 type: string
 *                 example: Ring Road Textile Market, Surat, Gujarat
 *               gstin:
 *                 type: string
 *                 example: "24AAAAA0000A1Z5"
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Supplier name already exists
 */
supplierRouter.post(
  '/',
  authenticate,
  requireManagerOrAdmin,
  processRequestBody(createSupplierSchema),
  asyncHandler((req: Request, res: Response) => getController().createSupplier(req, res)),
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier details by ID
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier retrieved successfully
 *       404:
 *         description: Supplier not found
 */
supplierRouter.get(
  '/:id',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getSupplierById(req, res)),
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier by ID
 *     tags: [Suppliers]
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
 *               contact_person:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               gstin:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       404:
 *         description: Supplier not found
 */
supplierRouter.put(
  '/:id',
  authenticate,
  requireManagerOrAdmin,
  processRequestBody(updateSupplierSchema),
  asyncHandler((req: Request, res: Response) => getController().updateSupplier(req, res)),
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Soft delete supplier by ID
 *     tags: [Suppliers]
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
 *         description: Supplier deleted successfully
 *       404:
 *         description: Supplier not found
 */
supplierRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler((req: Request, res: Response) => getController().deleteSupplier(req, res)),
);

export const supplierRouteConfig: ModuleRouteConfig = {
  basePath: '/suppliers',
  router: supplierRouter,
  group: 'public',
};

export default supplierRouter;
