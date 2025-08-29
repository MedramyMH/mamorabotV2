// Enhanced real-time pricing service with improved accuracy and WebSocket simulation

export class RealTimePricingService {
  constructor() {
    this.prices = new Map();
    this.subscribers = new Map();
    this.isConnected = false;
    this.updateInterval = null;
    this.priceHistory = new Map(); // Store price history for trend analysis
    this.marketSentiment = new Map(); // Track market sentiment
  }

  // Simulate real-time price updates with enhanced accuracy
  startRealTimeUpdates() {
    if (this.updateInterval) return;
    
    this.isConnected = true;
    this.updateInterval = setInterval(() => {
      this.updateAllPrices();
    }, 800); // Update every 800ms for more responsive updates
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isConnected = false;
  }

  updateAllPrices() {
    const symbols = [
      'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF',
      'BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'ADAUSD',
      'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META',
      'NASDAQ100', 'SP500', 'DOW30', 'GOLD', 'SILVER', 'USOIL'
    ];

    symbols.forEach(symbol => {
      const currentPrice = this.getCurrentPrice(symbol);
      const newPrice = this.generateEnhancedPriceMovement(symbol, currentPrice);
      
      // Store price history
      if (!this.priceHistory.has(symbol)) {
        this.priceHistory.set(symbol, []);
      }
      const history = this.priceHistory.get(symbol);
      history.push({ price: currentPrice, timestamp: Date.now() });
      
      // Keep only last 100 price points
      if (history.length > 100) {
        history.shift();
      }
      
      // Calculate enhanced metrics
      const change = newPrice - currentPrice;
      const changePercent = ((newPrice - currentPrice) / currentPrice) * 100;
      const trend = this.calculateTrend(symbol);
      const volatility = this.calculateVolatility(symbol);
      
      this.prices.set(symbol, {
        price: newPrice,
        timestamp: Date.now(),
        change: change,
        changePercent: changePercent,
        trend: trend,
        volatility: volatility,
        volume: this.generateVolume(symbol),
        bid: newPrice - this.getSpread(symbol) / 2,
        ask: newPrice + this.getSpread(symbol) / 2
      });

      // Update market sentiment
      this.updateMarketSentiment(symbol, changePercent);

      // Notify subscribers
      if (this.subscribers.has(symbol)) {
        this.subscribers.get(symbol).forEach(callback => {
          callback(this.prices.get(symbol));
        });
      }
    });
  }

  generateEnhancedPriceMovement(symbol, currentPrice) {
    const volatility = this.getSymbolVolatility(symbol);
    const marketSentiment = this.getMarketSentiment(symbol);
    const trend = this.calculateTrend(symbol);
    
    // Enhanced price movement with market microstructure
    const sentimentFactor = (marketSentiment - 0.5) * 0.3; // -0.15 to +0.15
    const trendFactor = trend * 0.2; // Trend influence
    const randomWalk = (Math.random() - 0.5) * volatility;
    const meanReversion = this.getMeanReversionForce(symbol, currentPrice) * 0.1;
    
    // Combine all factors
    const totalMovement = (sentimentFactor + trendFactor + randomWalk + meanReversion) * currentPrice;
    
    // Apply tick size constraints
    const tickSize = this.getTickSize(symbol);
    const newPrice = Math.round((currentPrice + totalMovement) / tickSize) * tickSize;
    
    // Ensure price doesn't move too dramatically (circuit breaker)
    const maxMove = currentPrice * 0.001; // 0.1% max move per update
    return Math.max(currentPrice - maxMove, Math.min(currentPrice + maxMove, newPrice));
  }

  calculateTrend(symbol) {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < 10) return 0;
    
    const recent = history.slice(-10);
    const oldest = recent[0].price;
    const newest = recent[recent.length - 1].price;
    
    return (newest - oldest) / oldest; // Normalized trend
  }

  calculateVolatility(symbol) {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < 20) return this.getSymbolVolatility(symbol);
    
    const recent = history.slice(-20);
    const returns = [];
    
    for (let i = 1; i < recent.length; i++) {
      const returnRate = (recent[i].price - recent[i-1].price) / recent[i-1].price;
      returns.push(returnRate);
    }
    
    // Calculate standard deviation
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  getMeanReversionForce(symbol, currentPrice) {
    const basePrice = this.getBasePrice(symbol);
    const deviation = (currentPrice - basePrice) / basePrice;
    
    // Mean reversion force increases with deviation
    return -deviation * 0.5; // Negative because it pulls back to mean
  }

  updateMarketSentiment(symbol, changePercent) {
    if (!this.marketSentiment.has(symbol)) {
      this.marketSentiment.set(symbol, 0.5); // Neutral
    }
    
    const currentSentiment = this.marketSentiment.get(symbol);
    const sentimentChange = changePercent > 0 ? 0.05 : -0.05;
    const newSentiment = Math.max(0, Math.min(1, currentSentiment + sentimentChange * 0.1));
    
    this.marketSentiment.set(symbol, newSentiment);
  }

  getMarketSentiment(symbol) {
    return this.marketSentiment.get(symbol) || 0.5;
  }

  generateVolume(symbol) {
    const baseVolume = this.getBaseVolume(symbol);
    const volatilityMultiplier = 1 + (Math.random() - 0.5) * 0.5;
    return Math.round(baseVolume * volatilityMultiplier);
  }

  getBaseVolume(symbol) {
    const volumes = {
      'EURUSD': 1000000, 'GBPUSD': 800000, 'USDJPY': 900000,
      'BTCUSD': 50000, 'ETHUSD': 80000,
      'AAPL': 100000, 'GOOGL': 50000, 'MSFT': 80000,
      'GOLD': 30000, 'SILVER': 20000
    };
    return volumes[symbol] || 10000;
  }

  getSpread(symbol) {
    const spreads = {
      'EURUSD': 0.00001, 'GBPUSD': 0.00002, 'USDJPY': 0.001,
      'BTCUSD': 0.5, 'ETHUSD': 0.1,
      'AAPL': 0.01, 'GOOGL': 0.02,
      'GOLD': 0.05, 'SILVER': 0.01
    };
    return spreads[symbol] || 0.01;
  }

  getSymbolVolatility(symbol) {
    const volatilities = {
      'EURUSD': 0.00008, 'GBPUSD': 0.0001, 'USDJPY': 0.008,
      'AUDUSD': 0.0001, 'USDCAD': 0.00009, 'NZDUSD': 0.00012,
      'BTCUSD': 30, 'ETHUSD': 3, 'LTCUSD': 0.5, 'XRPUSD': 0.005,
      'AAPL': 0.3, 'GOOGL': 0.8, 'MSFT': 0.4, 'TSLA': 1.2,
      'NASDAQ100': 3, 'SP500': 1.5, 'DOW30': 20,
      'GOLD': 0.3, 'SILVER': 0.015, 'USOIL': 0.5
    };
    return volatilities[symbol] || 0.001;
  }

  getTickSize(symbol) {
    if (symbol.includes('JPY')) return 0.001;
    if (symbol.includes('USD') && symbol.length === 6) return 0.00001;
    if (symbol.includes('BTC')) return 0.1;
    if (symbol.includes('ETH')) return 0.01;
    if (symbol === 'GOLD' || symbol === 'SILVER') return 0.01;
    if (['NASDAQ100', 'SP500', 'DOW30'].includes(symbol)) return 0.1;
    return 0.01;
  }

  getCurrentPrice(symbol) {
    if (this.prices.has(symbol)) {
      return this.prices.get(symbol).price;
    }
    return this.getBasePrice(symbol);
  }

  getBasePrice(symbol) {
    const prices = {
      'EURUSD': 1.08500, 'GBPUSD': 1.26420, 'USDJPY': 149.850,
      'AUDUSD': 0.67250, 'USDCAD': 1.34580, 'NZDUSD': 0.61480, 'USDCHF': 0.89750,
      'BTCUSD': 43850.00, 'ETHUSD': 2680.50, 'LTCUSD': 73.25, 'XRPUSD': 0.6180, 'ADAUSD': 0.4920,
      'AAPL': 195.89, 'GOOGL': 142.56, 'MSFT': 415.26, 'TSLA': 248.48, 'AMZN': 155.89, 'META': 485.59,
      'NASDAQ100': 16845.30, 'SP500': 4750.89, 'DOW30': 37504.81,
      'GOLD': 2045.50, 'SILVER': 24.85, 'USOIL': 78.45
    };
    return prices[symbol] || 100;
  }

  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    this.subscribers.get(symbol).push(callback);
  }

  unsubscribe(symbol, callback) {
    if (this.subscribers.has(symbol)) {
      const callbacks = this.subscribers.get(symbol);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Enhanced API simulation with better error handling
  async fetchRealTimePrice(symbol) {
    try {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      // Simulate occasional API failures (5% chance)
      if (Math.random() < 0.05) {
        throw new Error('API temporarily unavailable');
      }
      
      const priceData = this.prices.get(symbol) || {
        price: this.getCurrentPrice(symbol),
        timestamp: Date.now(),
        change: 0,
        changePercent: 0
      };
      
      return {
        symbol,
        ...priceData,
        source: 'enhanced_api'
      };
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      return null;
    }
  }

  // Get market statistics
  getMarketStats(symbol) {
    const priceData = this.prices.get(symbol);
    const history = this.priceHistory.get(symbol);
    
    if (!priceData || !history || history.length < 2) {
      return null;
    }
    
    const dayHigh = Math.max(...history.slice(-50).map(h => h.price));
    const dayLow = Math.min(...history.slice(-50).map(h => h.price));
    const openPrice = history.length > 20 ? history[history.length - 20].price : history[0].price;
    
    return {
      current: priceData.price,
      change: priceData.change,
      changePercent: priceData.changePercent,
      dayHigh,
      dayLow,
      open: openPrice,
      volume: priceData.volume,
      volatility: priceData.volatility,
      trend: priceData.trend,
      sentiment: this.getMarketSentiment(symbol)
    };
  }
}

export const pricingService = new RealTimePricingService();