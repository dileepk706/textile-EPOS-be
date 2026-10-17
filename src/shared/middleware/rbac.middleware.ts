import type { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';
import {
  UserRole,
  ADMIN_ROLES,
  MANAGEMENT_ROLES,
  ALL_STAFF_ROLES,
  RoleType,
} from '@/shared/constants/roles.js';

/**
 * Middleware to enforce role-based access control (RBAC).
 * Returns 403 Forbidden if the authenticated user's role does not match the allowed roles.
 */
export const requireRoles = (...allowedRoles: (RoleType | RoleType[])[]) => {
  const flattenedRoles = allowedRoles.flat().map((r) => String(r).toUpperCase());

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError('Authentication required. Please provide a valid token.', httpStatus.UNAUTHORIZED);
    }

    const rawRole = req.user.role || req.user.user_type || '';
    const userRole = String(rawRole).trim().toUpperCase();

    if (!userRole) {
      throw new ApiError('Access forbidden: No role assigned to this account.', httpStatus.FORBIDDEN);
    }

    // Super-admin / owner has full access across all operations
    if (userRole === UserRole.ADMIN || userRole === UserRole.OWNER) {
      return next();
    }

    if (!flattenedRoles.includes(userRole)) {
      throw new ApiError(
        `Access forbidden. Role '${userRole}' is not authorized to access this resource. Required: [${flattenedRoles.join(', ')}]`,
        httpStatus.FORBIDDEN,
      );
    }

    next();
  };
};

export const requireAdmin = requireRoles(ADMIN_ROLES);
export const requireManagerOrAdmin = requireRoles(MANAGEMENT_ROLES);
export const requireStaff = requireRoles(ALL_STAFF_ROLES);
