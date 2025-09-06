import { useCallback, useEffect, useState } from "react";
import { ConversionRate, PriceData, pricingService } from "~~/services/pricingService";

export interface UsePricingReturn {
  // Current rate data
  currentRate: ConversionRate | null;
  rateAge: number;
  isRateStale: boolean;

  // Conversion functions
  convertGhsToUsdc: (ghsAmount: number) => number;
  convertUsdcToGhs: (usdcAmount: number) => number;

  // Formatting functions
  formatGhsPrice: (amount: number) => string;
  formatUsdcPrice: (amount: number) => string;
  formatPrice: (amount: number, currency: string, decimals?: number) => string;

  // Actions
  forceUpdate: () => Promise<void>;
  refreshRate: () => Promise<void>;

  // Status
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export const usePricing = (): UsePricingReturn => {
  const [currentRate, setCurrentRate] = useState<ConversionRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Initialize pricing service
  useEffect(() => {
    const initializePricing = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get initial rate
        const initialRate = pricingService.getCurrentRate();
        if (initialRate) {
          setCurrentRate(initialRate);
          setLastUpdated(initialRate.timestamp);
        }

        // Subscribe to rate updates
        const unsubscribe = pricingService.subscribe(rate => {
          setCurrentRate(rate);
          setLastUpdated(rate.timestamp);
          setError(null);
        });

        setLoading(false);

        // Cleanup subscription on unmount
        return unsubscribe;
      } catch (err) {
        setError("Failed to initialize pricing service");
        setLoading(false);
        console.error("Pricing initialization error:", err);
      }
    };

    const cleanup = initializePricing();

    return () => {
      cleanup?.then(unsubscribe => unsubscribe?.());
    };
  }, []);

  // Conversion functions
  const convertGhsToUsdc = useCallback((ghsAmount: number): number => {
    return pricingService.convertGhsToUsdc(ghsAmount);
  }, []);

  const convertUsdcToGhs = useCallback((usdcAmount: number): number => {
    return pricingService.convertUsdcToGhs(usdcAmount);
  }, []);

  // Formatting functions
  const formatGhsPrice = useCallback((amount: number): string => {
    return pricingService.formatGhsPrice(amount);
  }, []);

  const formatUsdcPrice = useCallback((amount: number): string => {
    return pricingService.formatUsdcPrice(amount);
  }, []);

  const formatPrice = useCallback((amount: number, currency: string, decimals: number = 2): string => {
    return pricingService.formatPrice(amount, currency, decimals);
  }, []);

  // Actions
  const forceUpdate = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await pricingService.forceUpdate();
    } catch (err) {
      setError("Failed to update pricing");
      console.error("Force update error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRate = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await pricingService.forceUpdate();
    } catch (err) {
      setError("Failed to refresh rate");
      console.error("Refresh rate error:", err);
    }
  }, []);

  // Computed values
  const rateAge = currentRate ? pricingService.getRateAge() : 0;
  const isRateStale = pricingService.isRateStale(5); // 5 minutes

  return {
    // Current rate data
    currentRate,
    rateAge,
    isRateStale,

    // Conversion functions
    convertGhsToUsdc,
    convertUsdcToGhs,

    // Formatting functions
    formatGhsPrice,
    formatUsdcPrice,
    formatPrice,

    // Actions
    forceUpdate,
    refreshRate,

    // Status
    loading,
    error,
    lastUpdated,
  };
};

// Hook for price display with automatic updates
export const usePriceDisplay = (ghsAmount: number) => {
  const { convertGhsToUsdc, formatGhsPrice, formatUsdcPrice, currentRate, isRateStale } = usePricing();

  const usdcAmount = convertGhsToUsdc(ghsAmount);

  return {
    ghsFormatted: formatGhsPrice(ghsAmount),
    usdcFormatted: formatUsdcPrice(usdcAmount),
    usdcAmount,
    rate: currentRate,
    isStale: isRateStale,
  };
};

// Hook for real-time price conversion
export const usePriceConverter = () => {
  const { convertGhsToUsdc, convertUsdcToGhs, currentRate, loading, error } = usePricing();

  const [ghsAmount, setGhsAmount] = useState<number>(0);
  const [usdcAmount, setUsdcAmount] = useState<number>(0);
  const [activeInput, setActiveInput] = useState<"ghs" | "usdc">("ghs");

  // Update USDC when GHS changes
  useEffect(() => {
    if (activeInput === "ghs" && currentRate) {
      const converted = convertGhsToUsdc(ghsAmount);
      setUsdcAmount(converted);
    }
  }, [ghsAmount, currentRate, convertGhsToUsdc, activeInput]);

  // Update GHS when USDC changes
  useEffect(() => {
    if (activeInput === "usdc" && currentRate) {
      const converted = convertUsdcToGhs(usdcAmount);
      setGhsAmount(converted);
    }
  }, [usdcAmount, currentRate, convertUsdcToGhs, activeInput]);

  const updateGhsAmount = (amount: number) => {
    setGhsAmount(amount);
    setActiveInput("ghs");
  };

  const updateUsdcAmount = (amount: number) => {
    setUsdcAmount(amount);
    setActiveInput("usdc");
  };

  return {
    ghsAmount,
    usdcAmount,
    updateGhsAmount,
    updateUsdcAmount,
    currentRate,
    loading,
    error,
  };
};

// Hook for price history
export const usePriceHistory = () => {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPriceHistory = () => {
      try {
        const history = pricingService.getPriceHistory();
        setPriceHistory(history);
        setLoading(false);
      } catch (err) {
        setError("Failed to load price history");
        setLoading(false);
        console.error("Price history error:", err);
      }
    };

    loadPriceHistory();
  }, []);

  return {
    priceHistory,
    loading,
    error,
  };
};
