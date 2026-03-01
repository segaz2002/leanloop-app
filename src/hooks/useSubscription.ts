import { useState } from 'react';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';

interface UseSubscriptionReturn {
  isPremium: boolean;
  isTrialing: boolean;
  trialDaysLeft: number | null;
  offerings: PurchasesPackage[] | null;
  loading: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<void>;
  restore: () => Promise<void>;
  hasActiveAccess: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const {
    isPremium,
    isTrialing,
    trialDaysRemaining,
    currentOffering,
    loading,
    restore,
    refreshCustomerInfo,
  } = useRevenueCat();

  const [purchasing, setPurchasing] = useState(false);

  const purchase = async (pkg: PurchasesPackage) => {
    try {
      setPurchasing(true);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      // Refresh customer info to update UI
      await refreshCustomerInfo();
    } catch (error: any) {
      // User cancelled
      if (error.userCancelled) {
        console.log('Purchase cancelled by user');
        return;
      }
      
      console.error('Purchase failed:', error);
      throw error;
    } finally {
      setPurchasing(false);
    }
  };

  const offerings = currentOffering?.availablePackages || null;

  // User has active access if they're premium OR in trial
  const hasActiveAccess = isPremium || isTrialing;

  return {
    isPremium,
    isTrialing,
    trialDaysLeft: trialDaysRemaining,
    offerings,
    loading: loading || purchasing,
    purchase,
    restore,
    hasActiveAccess,
  };
}
