  ### Part 3: Implementing RBAC in your React App (FSD Architecture)
                                                                                                                                 
    src/                                                                                                                         
    ├── app/                                                                                                                     
    │   ├── router/                                                                                                              
    │   │   ├── modules/admin.tsx                                                                                                
    │   │   ├── modules/billing.tsx                                                                                              
    │   │   └── data-strategy.ts                                                                                                 
    ├── entities/                                                                                                                
    │   └── user/                                                                                                                
    │       ├── model/types.ts                                                                                                   
    │       ├── model/selectors.ts                                                                                               
    │       └── lib/permissions.ts      <-- Permission & Role Helper                                                             
    ├── shared/                                                                                                                  
    │   └── lib/                                                                                                                 
    │       ├── auth.middleware.ts                                                                                               
    │       └── rbac.middleware.ts      <-- Route Guard Middleware                                                               
  ──────                                                                                                                         
  #### 1. Define Permissions & Helper (entities/user/lib/permissions.ts)                                                         
                                                                                                                                 
    export type Role = 'ADMIN' | 'OWNER' | 'MANAGER' | 'CASHIER' | 'STAFF';                                                      
                                                                                                                                 
    export type Permission =                                                                                                     
      | 'portal:admin'                                                                                                           
      | 'portal:billing'                                                                                                         
      | 'staff:read'                                                                                                             
      | 'staff:create'                                                                                                           
      | 'staff:update'                                                                                                           
      | 'staff:delete'                                                                                                           
      | 'product:read'                                                                                                           
      | 'product:create'                                                                                                         
      | 'product:update'                                                                                                         
      | 'product:delete'                                                                                                         
      | 'supplier:read'                                                                                                          
      | 'supplier:create'                                                                                                        
      | 'supplier:update'                                                                                                        
      | 'supplier:delete'                                                                                                        
      | 'till:manage';                                                                                                           
                                                                                                                                 
    export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {                                                                
      ADMIN: [                                                                                                                   
        'portal:admin', 'portal:billing',                                                                                        
        'staff:read', 'staff:create', 'staff:update', 'staff:delete',                                                            
        'product:read', 'product:create', 'product:update', 'product:delete',                                                    
        'supplier:read', 'supplier:create', 'supplier:update', 'supplier:delete',                                                
        'till:manage',                                                                                                           
      ],                                                                                                                         
      OWNER: [                                                                                                                   
        'portal:admin', 'portal:billing',                                                                                        
        'staff:read', 'staff:create', 'staff:update', 'staff:delete',                                                            
        'product:read', 'product:create', 'product:update', 'product:delete',                                                    
        'supplier:read', 'supplier:create', 'supplier:update', 'supplier:delete',                                                
        'till:manage',                                                                                                           
      ],                                                                                                                         
      MANAGER: [                                                                                                                 
        'portal:admin', 'portal:billing',                                                                                        
        'staff:read',                                                                                                            
        'product:read', 'product:create', 'product:update',                                                                      
        'supplier:read', 'supplier:create', 'supplier:update',                                                                   
      ],                                                                                                                         
      CASHIER: [                                                                                                                 
        'portal:billing',                                                                                                        
        'product:read',                                                                                                          
      ],                                                                                                                         
      STAFF: [                                                                                                                   
        'portal:billing',                                                                                                        
        'product:read',                                                                                                          
      ],                                                                                                                         
    };                                                                                                                           
                                                                                                                                 
    export function hasPermission(userRole: string | undefined, permission: Permission): boolean {                               
      if (!userRole) return false;                                                                                               
      const role = userRole.toUpperCase() as Role;                                                                               
      const permissions = ROLE_PERMISSIONS[role] || [];                                                                          
      return permissions.includes(permission);                                                                                   
    }                                                                                                                            
                                                                                                                                 
    export function hasAnyRole(userRole: string | undefined, roles: Role[]): boolean {                                           
      if (!userRole) return false;                                                                                               
      const normalized = userRole.toUpperCase() as Role;                                                                         
      return roles.includes(normalized);                                                                                         
    }                                                                                                                            
  ──────                                                                                                                         
  #### 2. Create the RBAC Route Middleware (shared/lib/rbac.middleware.ts)                                                       
                                                                                                                                 
  Use this with React Router 6.4+ middleware / loaders:                                                                          
                                                                                                                                 
    import { redirect } from 'react-router-dom';                                                                                 
    import { pathKeys } from 'shared/routes';                                                                                    
    import { hasPermission, Permission, Role, hasAnyRole } from 'entities/user/lib/permissions';                                 
    import { getStoredUser } from 'entities/user/model/storage'; // Your localStorage / auth store getter                        
                                                                                                                                 
    export const rbacPermissionMiddleware = (requiredPermission: Permission) => {                                                
      return async () => {                                                                                                       
        const user = getStoredUser();                                                                                            
        if (!user) {                                                                                                             
          throw redirect(pathKeys.auth.login);                                                                                   
        }                                                                                                                        
                                                                                                                                 
        if (!hasPermission(user.role, requiredPermission)) {                                                                     
          // If a Cashier tries to access Admin portal, redirect them to Billing Portal                                          
          if (user.role?.toUpperCase() === 'CASHIER') {                                                                          
            throw redirect(pathKeys.billing.root); // e.g., '/billing'                                                           
          }                                                                                                                      
          throw redirect(pathKeys.page404); // or an unauthorized 403 page                                                       
        }                                                                                                                        
                                                                                                                                 
        return null;                                                                                                             
      };                                                                                                                         
    };                                                                                                                           
                                                                                                                                 
    export const rbacRoleMiddleware = (...allowedRoles: Role[]) => {                                                             
      return async () => {                                                                                                       
        const user = getStoredUser();                                                                                            
        if (!user) {                                                                                                             
          throw redirect(pathKeys.auth.login);                                                                                   
        }                                                                                                                        
                                                                                                                                 
        if (!hasAnyRole(user.role, allowedRoles)) {                                                                              
          if (user.role?.toUpperCase() === 'CASHIER') {                                                                          
            throw redirect(pathKeys.billing.root);                                                                               
          }                                                                                                                      
          throw redirect(pathKeys.page404);                                                                                      
        }                                                                                                                        
                                                                                                                                 
        return null;                                                                                                             
      };                                                                                                                         
    };                                                                                                                           
  ──────                                                                                                                         
  #### 3. Protect Admin Routes & Sub-routes (modules/admin.tsx)                                                                  
                                                                                                                                 
  In your admin.tsx, protect the root admin layout with portal:admin, and protect sensitive actions (like creating/updating      
  staff):                                                                                                                        
                                                                                                                                 
    import { Suspense } from 'react';                                                                                            
    import { Outlet, RouteObject, redirect } from 'react-router-dom';                                                            
    import { SplashScreen } from 'shared/ui/loading';                                                                            
    import AppLayout from '@layouts/app/app.layout';                                                                             
    import { authMiddleware } from 'shared/lib/auth.middleware';                                                                 
    import { workspaceMiddleware } from 'shared/lib/workspace.middleware';                                                       
    import { rbacRoleMiddleware, rbacPermissionMiddleware } from 'shared/lib/rbac.middleware';                                   
    import { getStoredUser } from 'entities/user/model/storage';                                                                 
    import { pathKeys } from 'shared/routes';                                                                                    
                                                                                                                                 
    export const adminRoutes: RouteObject = {                                                                                    
      path: '/',                                                                                                                 
      loader: async () => {                                                                                                      
        // 1. Check if user is logged in                                                                                         
        const user = getStoredUser();                                                                                            
        if (!user) return redirect(pathKeys.auth.login);                                                                         
                                                                                                                                 
        // 2. If Cashier/Staff, redirect directly to Billing Portal!                                                             
        const role = user.role?.toUpperCase();                                                                                   
        if (role === 'CASHIER' || role === 'STAFF') {                                                                            
          return redirect(pathKeys.billing.root); // e.g., '/billing'                                                            
        }                                                                                                                        
                                                                                                                                 
        return null;                                                                                                             
      },                                                                                                                         
      handle: {                                                                                                                  
        middleware: [                                                                                                            
          authMiddleware,                                                                                                        
          workspaceMiddleware,                                                                                                   
          rbacPermissionMiddleware('portal:admin')                                                                               
        ],                                                                                                                       
      },                                                                                                                         
      element: (                                                                                                                 
        <AppLayout>                                                                                                              
          <Suspense fallback={<SplashScreen loadingText="Loading store details" />}>                                             
            <Outlet />                                                                                                           
          </Suspense>                                                                                                            
        </AppLayout>                                                                                                             
      ),                                                                                                                         
      children: [                                                                                                                
        dashboardPageRoute,                                                                                                      
        userProfilePageRoute,                                                                                                    
        userListRoute,                                                                                                           
        staffCreateRoute,   // Has loader with rbacRoleMiddleware('ADMIN', 'OWNER')                                              
        staffUpdateRoute,   // Has loader with rbacRoleMiddleware('ADMIN', 'OWNER')                                              
        productListRoute,                                                                                                        
        productCreateRoute,                                                                                                      
        productUpdateRoute,                                                                                                      
        supplierListRoute,                                                                                                       
        supplierCreateRoute,                                                                                                     
        supplierUpdateRoute,                                                                                                     
      ],                                                                                                                         
    };                                                                                                                           
                                                                                                                                 
  And for a specific restricted route like staff-update.route.tsx:                                                               
                                                                                                                                 
    import { RouteObject } from 'react-router-dom';                                                                              
    import { pathKeys } from 'shared/routes';                                                                                    
    import { ApiErrorView } from 'shared/ui/api-error-views';                                                                    
    import { rbacRoleMiddleware } from 'shared/lib/rbac.middleware';                                                             
    import StaffUpdatePage from './staff-update.page.ui';                                                                        
    import { StaffUpdateLoader } from './staff-update.loader';                                                                   
                                                                                                                                 
    export const staffUpdateRoute: RouteObject = {                                                                               
      path: `${pathKeys.staff.updateFP}/:id`,                                                                                    
      element: <StaffUpdatePage />,                                                                                              
      loader: async (args) => {                                                                                                  
        // Guard against non-admin access                                                                                        
        await rbacRoleMiddleware('ADMIN', 'OWNER')();                                                                            
        return StaffUpdateLoader(args);                                                                                          
      },                                                                                                                         
      errorElement: <ApiErrorView backHref={pathKeys.staff.root} backLabel="Back to Staff List" />,                              
    };                                                                                                                           
  ──────                                                                                                                         
  #### 4. Dynamic Sidebar Filtering (ConfigNavigation.tsx)                                                                       
                                                                                                                                 
  Filter navigation items dynamically based on the logged-in user's role/permissions so cashiers do not see the staff or supplier
  tabs:                                                                                                                          
                                                                                                                                 
    import { useMemo } from 'react';                                                                                             
    import { useLocales } from '@locales';                                                                                       
    import { pathKeys } from 'shared/routes';                                                                                    
    import { IconsElement } from 'shared/ui/iconify/icons';                                                                      
    import { useCurrentUser } from 'entities/user/model/useCurrentUser'; // Your user hook or selector                           
    import { hasPermission } from 'entities/user/lib/permissions';                                                               
                                                                                                                                 
    export function useNavData() {                                                                                               
      const { t } = useLocales();                                                                                                
      const { user } = useCurrentUser();                                                                                         
                                                                                                                                 
      const data = useMemo(() => {                                                                                               
        const items = [                                                                                                          
          // Products (Admin & Manager)                                                                                          
          hasPermission(user?.role, 'product:read') && {                                                                         
            title: t('products'),                                                                                                
            path: pathKeys.products,                                                                                             
            icon: IconsElement.product,                                                                                          
          },                                                                                                                     
          // Staff management (Admin & Manager only)                                                                             
          hasPermission(user?.role, 'staff:read') && {                                                                           
            title: t('staffs'),                                                                                                  
            path: pathKeys.staff.root,                                                                                           
            icon: IconsElement.employee,                                                                                         
          },                                                                                                                     
          // Suppliers (Admin & Manager only)                                                                                    
          hasPermission(user?.role, 'supplier:read') && {                                                                        
            title: t('suppliers'),                                                                                               
            path: pathKeys.supplier.root,                                                                                        
            icon: IconsElement.supplier,                                                                                         
          },                                                                                                                     
          // Customers                                                                                                           
          {                                                                                                                      
            title: t('customer'),                                                                                                
            path: pathKeys.customers,                                                                                            
            icon: IconsElement.employee,                                                                                         
          },                                                                                                                     
        ].filter(Boolean); // Remove falsy items                                                                                 
                                                                                                                                 
        return [                                                                                                                 
          {                                                                                                                      
            subheader: '',                                                                                                       
            items,                                                                                                               
          },                                                                                                                     
        ];                                                                                                                       
      }, [t, user?.role]);                                                                                                       
                                                                                                                                 
      return data;                                                                                                               
    }                                                                                                                            
  ──────                                                                                                                         
  #### 5. Action Buttons in Features (e.g. DeleteStaffButton, EditStaffButton)                                                   
                                                                                                                                 
  Create a reusable <Can /> guard component in shared/ui or entities/user:                                                       
                                                                                                                                 
    // shared/ui/can/can.tsx                                                                                                     
    import { ReactNode } from 'react';                                                                                           
    import { useCurrentUser } from 'entities/user/model/useCurrentUser';                                                         
    import { hasPermission, Permission } from 'entities/user/lib/permissions';                                                   
                                                                                                                                 
    interface CanProps {                                                                                                         
      do: Permission;                                                                                                            
      children: ReactNode;                                                                                                       
      fallback?: ReactNode;                                                                                                      
    }                                                                                                                            
                                                                                                                                 
    export function Can({ do: action, children, fallback = null }: CanProps) {                                                   
      const { user } = useCurrentUser();                                                                                         
      if (!hasPermission(user?.role, action)) {                                                                                  
        return <>{fallback}</>;                                                                                                  
      }                                                                                                                          
      return <>{children}</>;                                                                                                    
    }                                                                                                                            
                                                                                                                                 
  Now in your feature components (e.g. features/staff-delete):                                                                   
                                                                                                                                 
    import { Can } from 'shared/ui/can';                                                                                         
    import { IconButton } from '@mui/material';                                                                                  
    import DeleteIcon from '@mui/icons-material/Delete';                                                                         
                                                                                                                                 
    export function StaffDeleteAction({ staffId }: { staffId: string }) {                                                        
      const handleDelete = () => { /* trigger delete api */ };                                                                   
                                                                                                                                 
      return (                                                                                                                   
        <Can do="staff:delete">                                                                                                  
          <IconButton onClick={handleDelete} color="error">                                                                      
            <DeleteIcon />                                                                                                       
          </IconButton>                                                                                                          
        </Can>                                                                                                                   
      );                                                                                                                         
    }                                                                                                                            
                                                                                                                                 
  ### Summary                                                                                                                    
                                                                                                                                 
  1. At Login: Backend sends user: { role: 'ADMIN' | 'CASHIER' | 'MANAGER', ... }.                                               
  2. At App Entry (adminRoutes.loader): If role === 'CASHIER', redirect to /billing.                                             
  3. In Sidebar (ConfigNavigation): Filter menu items using hasPermission(user.role, 'staff:read').                              
  4. Inside Tables / Forms: Wrap delete/edit buttons in <Can do="staff:delete">.                                                 
  5. At API Calls: Backend returns 403 Forbidden if any unauthorized request bypasses the client.                                