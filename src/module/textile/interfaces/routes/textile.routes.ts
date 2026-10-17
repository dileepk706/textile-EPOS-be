import { Router, Request, Response } from 'express';
import { container } from '@/config/container.js';
import ITextileController from '@/module/textile/domain/interfaces/textile.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import { requireAdmin } from '@/shared/middleware/rbac.middleware.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { createTextileSchema } from '@/module/textile/application/dtos/create-textile.dto.js';
import { updateTextileSchema } from '@/module/textile/application/dtos/update-textile.dto.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';

const textileRouter = Router();

const getController = () => container.resolve<ITextileController>('ITextileController');

/**
 * @swagger
 * tags:
 *   name: Textile
 *   description: Textile store profile, business details, and POS configurations
 */

/**
 * @swagger
 * /api/textiles:
 *   get:
 *     summary: Get current textile store details
 *     tags: [Textile]
 *     responses:
 *       200:
 *         description: Textile store details retrieved successfully
 *       404:
 *         description: Textile store not found
 */
textileRouter.get(
  '/',
  authenticate,
  asyncHandler((req: Request, res: Response) => getController().getTextile(req, res)),
);

/**
 * @swagger
 * /api/textiles/{id}:
 *   get:
 *     summary: Get textile store by ID
 *     tags: [Textile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Textile store retrieved successfully
 *       404:
 *         description: Textile store not found
 */
textileRouter.get(
  '/:id',
  authenticate,
  asyncHandler((req: Request, res: Response) => getController().getTextile(req, res)),
);

/**
 * @swagger
 * /api/textiles:
 *   put:
 *     summary: Update current textile store details (requires Bearer token)
 *     tags: [Textile]
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
 *                 example: Classic Silks & Textiles
 *               phone:
 *                 type: string
 *                 example: "+91 98765 43210"
 *               email:
 *                 type: string
 *                 example: "contact@classicsilks.com"
 *               gstin:
 *                 type: string
 *                 example: "29ABCDE1234F1Z5"
 *               currency:
 *                 type: string
 *                 example: "INR"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postal_code:
 *                     type: string
 *                   country:
 *                     type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   receipt_header:
 *                     type: string
 *                   receipt_footer:
 *                     type: string
 *                   tax_rate:
 *                     type: number
 *                   enable_barcode:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Textile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
textileRouter.put(
  '/',
  authenticate,
  requireAdmin,
  processRequestBody(updateTextileSchema),
  asyncHandler((req: Request, res: Response) => getController().updateTextile(req, res)),
);

/**
 * @swagger
 * /api/textiles/{id}:
 *   put:
 *     summary: Update textile store by ID (requires Bearer token)
 *     tags: [Textile]
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
 *         description: Textile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Textile not found
 */
textileRouter.put(
  '/:id',
  authenticate,
  requireAdmin,
  processRequestBody(updateTextileSchema),
  asyncHandler((req: Request, res: Response) => getController().updateTextile(req, res)),
);

/**
 * @swagger
 * /api/textiles:
 *   post:
 *     summary: Create a new textile store (requires Bearer token)
 *     tags: [Textile]
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
 *                 example: Heritage Fabrics
 *               code:
 *                 type: string
 *                 example: TXT-HERITAGE
 *     responses:
 *       201:
 *         description: Textile store created successfully
 *       401:
 *         description: Unauthorized
 */
textileRouter.post(
  '/',
  authenticate,
  requireAdmin,
  processRequestBody(createTextileSchema),
  asyncHandler((req: Request, res: Response) => getController().createTextile(req, res)),
);

export const textileRouteConfig: ModuleRouteConfig = {
  basePath: '/textiles',
  router: textileRouter,
  group: 'public',
};

export default textileRouter;
