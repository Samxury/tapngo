// Pricing Service for real-time currency conversion and price updates
// This service handles GHS to USDC conversion and real-time price feeds

export interface PriceData {
  currency: string;
  price: number;
  timestamp: number;
  source: string;
}

export interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  source: string;
}

export interface PricingConfig {
  baseCurrency: string;
  targetCurrency: string;
  updateInterval: number; // in milliseconds
  fallbackRate: number;
  sources: string[];
}

class PricingService {
  private config: PricingConfig = {
    baseCurrency: 'GHS',
    targetCurrency: 'USDC',
    updateInterval: 30000, // 30 seconds
    fallbackRate: 16.3, // Fallback GHS to USDC rate
    sources: ['coingecko', 'binance', 'coinbase']
  };

  private currentRate: ConversionRate | null = null;
  private priceHistory: PriceData[] = [];
  private updateTimer: NodeJS.Timeout | null = null;
  private subscribers: ((rate: ConversionRate) => void)[] = [];

  constructor() {
    this.initializePricing();
  }

  // Initialize pricing system
  private async initializePricing() {
    try {
      await this.updateConversionRate();
      this.startPeriodicUpdates();
    } catch (error) {
      console.error('Failed to initialize pricing:', error);
      this.setFallbackRate();
    }
  }

  // Start periodic price updates
  private startPeriodicUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      try {
        await this.updateConversionRate();
      } catch (error) {
        console.error('Failed to update conversion rate:', error);
      }
    }, this.config.updateInterval);
  }

  // Update conversion rate from multiple sources
  private async updateConversionRate(): Promise<void> {
    const rates: ConversionRate[] = [];

    // Try multiple sources for better reliability
    for (const source of this.config.sources) {
      try {
        const rate = await this.fetchRateFromSource(source);
        if (rate) {
          rates.push(rate);
        }
      } catch (error) {
        console.warn(`Failed to fetch rate from ${source}:`, error);
      }
    }

    if (rates.length > 0) {
      // Use the most recent rate or average if multiple sources
      const latestRate = rates.reduce((latest, current) => 
        current.timestamp > latest.timestamp ? current : latest
      );
      
      this.currentRate = latestRate;
      this.notifySubscribers(latestRate);
    } else {
      // Fallback to cached rate or default
      this.setFallbackRate();
    }
  }

  // Fetch rate from specific source
  private async fetchRateFromSource(source: string): Promise<ConversionRate | null> {
    // Try direct API call first
    let rate: ConversionRate | null = null;
    
    try {
      switch (source) {
        case 'coingecko':
          rate = await this.fetchFromCoinGecko();
          break;
        case 'binance':
          rate = await this.fetchFromBinance();
          break;
        case 'coinbase':
          rate = await this.fetchFromCoinbase();
          break;
        default:
          return null;
      }
      
      // If direct call succeeded, return the rate
      if (rate) {
        return rate;
      }
    } catch (error) {
      console.warn(`Direct API call failed for ${source}, trying proxy:`, error);
    }
    
    // If direct call failed, try using the proxy
    try {
      rate = await this.fetchFromSourceViaProxy(source);
      if (rate) {
        console.log(`Successfully fetched ${source} rate via proxy`);
        return rate;
      }
    } catch (proxyError) {
      console.warn(`Proxy call also failed for ${source}:`, proxyError);
    }
    
    return null;
  }

  // Fetch from source via proxy to avoid CORS issues
  private async fetchFromSourceViaProxy(source: string): Promise<ConversionRate | null> {
    try {
      let proxyUrl: string;
      let symbol: string;

      switch (source) {
        case 'binance':
          // Try USDTGHS first, then fallback to USDCUSDT
          try {
            symbol = 'USDTGHS';
            proxyUrl = `/api/pricing-proxy?source=binance&symbol=${symbol}`;
            const ghsResponse = await fetch(proxyUrl);
            if (ghsResponse.ok) {
              const ghsData = await ghsResponse.json();
              const usdtToGhs = parseFloat(ghsData.price);
              if (!isNaN(usdtToGhs) && usdtToGhs > 0) {
                // Get USDC/USDT rate
                const usdcResponse = await fetch(`/api/pricing-proxy?source=binance&symbol=USDCUSDT`);
                if (usdcResponse.ok) {
                  const usdcData = await usdcResponse.json();
                  const usdcToUsdt = parseFloat(usdcData.price);
                  if (!isNaN(usdcToUsdt) && usdcToUsdt > 0) {
                    return {
                      from: 'USDC',
                      to: 'GHS',
                      rate: usdcToUsdt * usdtToGhs,
                      timestamp: Date.now(),
                      source: 'binance-proxy'
                    };
                  }
                }
              }
            }
          } catch (ghsError) {
            console.warn('USDTGHS via proxy failed, trying fallback');
          }
          
          // Fallback to USD rate
          const usdcResponse = await fetch(`/api/pricing-proxy?source=binance&symbol=USDCUSDT`);
          const usdResponse = await fetch(`/api/pricing-proxy?source=binance&symbol=USDTUSD`);
          
          if (usdcResponse.ok && usdResponse.ok) {
            const usdcData = await usdcResponse.json();
            const usdData = await usdResponse.json();
            const usdcToUsdt = parseFloat(usdcData.price);
            const usdtToUsd = parseFloat(usdData.price);
            
            if (!isNaN(usdcToUsdt) && !isNaN(usdtToUsd) && usdcToUsdt > 0 && usdtToUsd > 0) {
              const ghsToUsd = 0.061; // Approximate rate
              return {
                from: 'USDC',
                to: 'GHS',
                rate: usdcToUsdt * usdtToUsd / ghsToUsd,
                timestamp: Date.now(),
                source: 'binance-proxy-fallback'
              };
            }
          }
          break;
          
        case 'coingecko':
          proxyUrl = `/api/pricing-proxy?source=coingecko&symbol=USDCGHS`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const data = await response.json();
            const rate = data['usd-coin']?.ghs;
            if (rate && !isNaN(rate) && rate > 0) {
              return {
                from: 'USDC',
                to: 'GHS',
                rate: rate,
                timestamp: Date.now(),
                source: 'coingecko-proxy'
              };
            }
          }
          break;
          
        case 'coinbase':
          proxyUrl = `/api/pricing-proxy?source=coinbase&symbol=USDC`;
          const coinbaseResponse = await fetch(proxyUrl);
          if (coinbaseResponse.ok) {
            const data = await coinbaseResponse.json();
            const rate = data.data?.rates?.GHS;
            if (rate) {
              const parsedRate = parseFloat(rate);
              if (!isNaN(parsedRate) && parsedRate > 0) {
                return {
                  from: 'USDC',
                  to: 'GHS',
                  rate: parsedRate,
                  timestamp: Date.now(),
                  source: 'coinbase-proxy'
                };
              }
            }
          }
          break;
      }
    } catch (error) {
      console.error(`Proxy fetch error for ${source}:`, error);
    }
    
    return null;
  }

  // Fetch from CoinGecko API with improved error handling
  private async fetchFromCoinGecko(): Promise<ConversionRate | null> {
    try {
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      };

      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ghs',
        fetchOptions
      );
      
      if (!response.ok) {
        console.warn('CoinGecko API error:', response.status, response.statusText);
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      const rate = data['usd-coin']?.ghs;
      
      if (rate && !isNaN(rate) && rate > 0) {
        return {
          from: 'USDC',
          to: 'GHS',
          rate: rate,
          timestamp: Date.now(),
          source: 'coingecko'
        };
      } else {
        console.warn('Invalid rate received from CoinGecko:', rate);
      }
    } catch (error) {
      console.error('CoinGecko fetch error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - possible CORS issue or connectivity problem');
      }
    }
    return null;
  }

  // Fetch from Binance API with improved error handling
  private async fetchFromBinance(): Promise<ConversionRate | null> {
    try {
      // Create fetch options with timeout and proper headers
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout using AbortController
        signal: AbortSignal.timeout(10000), // 10 second timeout
      };

      // First get USDC/USDT rate
      const usdcResponse = await fetch(
        'https://api.binance.com/api/v3/ticker/price?symbol=USDCUSDT',
        fetchOptions
      );
      
      if (!usdcResponse.ok) {
        console.warn('Binance USDC API error:', usdcResponse.status, usdcResponse.statusText);
        throw new Error(`Binance USDC API error: ${usdcResponse.status}`);
      }
      
      const usdcData = await usdcResponse.json();
      const usdcToUsdt = parseFloat(usdcData.price);
      
      if (isNaN(usdcToUsdt) || usdcToUsdt <= 0) {
        throw new Error('Invalid USDC/USDT rate received');
      }
      
      // Try to get USDT/GHS rate first
      try {
        const ghsResponse = await fetch(
          'https://api.binance.com/api/v3/ticker/price?symbol=USDTGHS',
          fetchOptions
        );
        
        if (ghsResponse.ok) {
          const ghsData = await ghsResponse.json();
          const usdtToGhs = parseFloat(ghsData.price);
          
          if (!isNaN(usdtToGhs) && usdtToGhs > 0) {
            const rate = usdcToUsdt * usdtToGhs;
            
            return {
              from: 'USDC',
              to: 'GHS',
              rate: rate,
              timestamp: Date.now(),
              source: 'binance'
            };
          }
        }
      } catch (ghsError) {
        console.warn('USDTGHS pair not available, trying fallback:', ghsError);
      }
      
      // Fallback: Try GHSUSDT (reverse pair)
      try {
        const ghsReverseResponse = await fetch(
          'https://api.binance.com/api/v3/ticker/price?symbol=GHSUSDT',
          fetchOptions
        );
        
        if (ghsReverseResponse.ok) {
          const ghsReverseData = await ghsReverseResponse.json();
          const ghsToUsdt = parseFloat(ghsReverseData.price);
          
          if (!isNaN(ghsToUsdt) && ghsToUsdt > 0) {
            const rate = usdcToUsdt / ghsToUsdt; // Inverse calculation
            
            return {
              from: 'USDC',
              to: 'GHS',
              rate: rate,
              timestamp: Date.now(),
              source: 'binance'
            };
          }
        }
      } catch (ghsReverseError) {
        console.warn('GHSUSDT pair not available, trying USD fallback:', ghsReverseError);
      }
      
      // Final fallback: Use USD rate with approximate GHS conversion
      const usdResponse = await fetch(
        'https://api.binance.com/api/v3/ticker/price?symbol=USDTUSD',
        fetchOptions
      );
      
      if (!usdResponse.ok) {
        throw new Error(`Binance USD API error: ${usdResponse.status}`);
      }
      
      const usdData = await usdResponse.json();
      const usdtToUsd = parseFloat(usdData.price);
      
      if (isNaN(usdtToUsd) || usdtToUsd <= 0) {
        throw new Error('Invalid USDT/USD rate received');
      }
      
      // Use approximate GHS/USD rate (this would need to be updated with real data)
      const ghsToUsd = 0.061; // Approximate rate - you should update this with real data
      const rate = usdcToUsdt * usdtToUsd / ghsToUsd;
      
      return {
        from: 'USDC',
        to: 'GHS',
        rate: rate,
        timestamp: Date.now(),
        source: 'binance-fallback'
      };
      
    } catch (error) {
      console.error('Binance fetch error:', error);
      
      // If it's a network error, try to provide more specific information
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - possible CORS issue or connectivity problem');
      }
    }
    return null;
  }

  // Fetch from Coinbase API with improved error handling
  private async fetchFromCoinbase(): Promise<ConversionRate | null> {
    try {
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      };

      const response = await fetch(
        'https://api.coinbase.com/v2/exchange-rates?currency=USDC',
        fetchOptions
      );
      
      if (!response.ok) {
        console.warn('Coinbase API error:', response.status, response.statusText);
        throw new Error(`Coinbase API error: ${response.status}`);
      }
      
      const data = await response.json();
      const rate = data.data?.rates?.GHS;
      
      if (rate) {
        const parsedRate = parseFloat(rate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          return {
            from: 'USDC',
            to: 'GHS',
            rate: parsedRate,
            timestamp: Date.now(),
            source: 'coinbase'
          };
        } else {
          console.warn('Invalid rate received from Coinbase:', rate);
        }
      } else {
        console.warn('GHS rate not available from Coinbase');
      }
    } catch (error) {
      console.error('Coinbase fetch error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - possible CORS issue or connectivity problem');
      }
    }
    return null;
  }

  // Set fallback rate
  private setFallbackRate() {
    this.currentRate = {
      from: 'USDC',
      to: 'GHS',
      rate: this.config.fallbackRate,
      timestamp: Date.now(),
      source: 'fallback'
    };
    this.notifySubscribers(this.currentRate);
  }

  // Notify subscribers of rate changes
  private notifySubscribers(rate: ConversionRate) {
    this.subscribers.forEach(callback => {
      try {
        callback(rate);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Public methods

  // Get current conversion rate
  getCurrentRate(): ConversionRate | null {
    return this.currentRate;
  }

  // Convert amount from GHS to USDC
  convertGhsToUsdc(ghsAmount: number): number {
    if (!this.currentRate) {
      return ghsAmount / this.config.fallbackRate;
    }
    return ghsAmount / this.currentRate.rate;
  }

  // Convert amount from USDC to GHS
  convertUsdcToGhs(usdcAmount: number): number {
    if (!this.currentRate) {
      return usdcAmount * this.config.fallbackRate;
    }
    return usdcAmount * this.currentRate.rate;
  }

  // Subscribe to rate updates
  subscribe(callback: (rate: ConversionRate) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Force update conversion rate
  async forceUpdate(): Promise<void> {
    await this.updateConversionRate();
  }

  // Get price history
  getPriceHistory(): PriceData[] {
    return [...this.priceHistory];
  }

  // Update configuration
  updateConfig(newConfig: Partial<PricingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.updateInterval) {
      this.startPeriodicUpdates();
    }
  }

  // Get configuration
  getConfig(): PricingConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.subscribers = [];
  }

  // Utility methods for formatting
  formatPrice(amount: number, currency: string, decimals: number = 2): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return formatter.format(amount);
  }

  formatGhsPrice(amount: number): string {
    return `₵${amount.toFixed(2)}`;
  }

  formatUsdcPrice(amount: number): string {
    return `$${amount.toFixed(2)} USDC`;
  }

  // Get rate age in minutes
  getRateAge(): number {
    if (!this.currentRate) return 0;
    return (Date.now() - this.currentRate.timestamp) / (1000 * 60);
  }

  // Check if rate is stale
  isRateStale(maxAgeMinutes: number = 5): boolean {
    return this.getRateAge() > maxAgeMinutes;
  }
}

// Create and export singleton instance
export const pricingService = new PricingService();

// Export types
export type { PriceData, ConversionRate, PricingConfig };
