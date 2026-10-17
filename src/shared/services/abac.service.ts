export interface AbacContext {
  tenant_id: string;
  textiles_id?: string;
  staff_id?: string;
  user_id?: string;
  user_type?: 'owner' | 'member' | 'staff' | 'admin' | null;
  resource?: string;
  action?: string;
  feature_key?: string;
}

export class AbacService {
  /**
   * Evaluates if the current context has access to the requested resource/action/feature
   */
  static async canAccess(context: AbacContext): Promise<{ allowed: boolean; reason?: string }> {
    const { user_type, feature_key } = context;

    // 1. Feature Flag / Subscription Plan Check (Placeholder for Textile EPOS)
    if (feature_key) {
      const hasFeature = await this.checkFeatureAccess(context.tenant_id, feature_key);
      if (!hasFeature) {
        return {
          allowed: false,
          reason: `Feature '${feature_key}' is not available for this tenant's plan or is disabled.`,
        };
      }
    }

    // 2. Owners or admins typically bypass staff permission checks
    if (user_type === 'owner' || user_type === 'admin') {
      return { allowed: true };
    }

    return { allowed: true };
  }

  private static async checkFeatureAccess(
    _tenant_id: string,
    _feature_key: string,
  ): Promise<boolean> {
    // Placeholder for textile EPOS feature flag access
    return true;
  }
}
