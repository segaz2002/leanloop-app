import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isPremium: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  loading: boolean;
  restore: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
  userId: string;
}

export function RevenueCatProvider({ children, userId }: RevenueCatProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePurchases();
  }, [userId]);

  const initializePurchases = async () => {
    try {
      // Set log level for debugging
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Get API keys from environment
      const apiKey = Platform.select({
        ios: Constants.expoConfig?.extra?.revenueCatAppleKey,
        android: Constants.expoConfig?.extra?.revenueCatGoogleKey,
      });

      if (!apiKey) {
        console.warn('RevenueCat API key not configured for this platform');
        setLoading(false);
        return;
      }

      // Configure Purchases SDK
      await Purchases.configure({ apiKey });

      // Set user ID
      await Purchases.logIn(userId);

      // Get customer info
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      // Get current offering
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setCurrentOffering(offerings.current);
      }

      // Listen for customer info updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        setCustomerInfo(info);
      });
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomerInfo = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error('Failed to refresh customer info:', error);
    }
  };

  const restore = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  };

  // Check if user has premium entitlement
  const isPremium = customerInfo?.entitlements.active['premium'] !== undefined;

  // Check if user is in trial
  const premiumEntitlement = customerInfo?.entitlements.active['premium'];
  const isTrialing = premiumEntitlement?.periodType === 'TRIAL' || false;

  // Calculate trial days remaining
  const trialDaysRemaining = (() => {
    if (!isTrialing || !premiumEntitlement?.expirationDate) return null;

    const expirationDate = new Date(premiumEntitlement.expirationDate);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  })();

  return (
    <RevenueCatContext.Provider
      value={{
        customerInfo,
        currentOffering,
        isPremium,
        isTrialing,
        trialDaysRemaining,
        loading,
        restore,
        refreshCustomerInfo,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within RevenueCatProvider');
  }
  return context;
}
