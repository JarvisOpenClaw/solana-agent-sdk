/**
 * Yields Module - DeFi yield intelligence via SolanaYield API
 * 
 * Provides real-time yield data and AI-powered optimization recommendations
 * across Kamino, Drift, Jito, Marinade, and more Solana protocols.
 * 
 * Contributed by @jeeves (SolanaYield) for Colosseum Agent Hackathon
 * API: https://solana-yield.vercel.app
 */

export interface YieldOpportunity {
  protocol: string;
  asset: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  supported: boolean;
  pool: string;
}

export interface AutopilotDecision {
  timestamp: string;
  type: 'hold' | 'rebalance' | 'enter';
  confidence: number;
  reasoning: string[];
  recommendation: string | null;
  topOpportunities: YieldOpportunity[];
}

export interface YieldsResponse {
  count: number;
  supported_protocols: string[];
  yields: YieldOpportunity[];
}

export interface AutopilotResponse {
  agent: string;
  version: string;
  strategy: {
    name: string;
    riskTolerance: string;
    rebalanceThreshold: number;
  };
  decision: AutopilotDecision;
  status: {
    isLive: boolean;
    mode: string;
    message: string;
  };
}

export class YieldsModule {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://solana-yield.vercel.app') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get real-time yields from Solana DeFi protocols
   * 
   * @param options.extended - Include additional protocols (default: false)
   * @param options.minApy - Minimum APY filter (default: 0)
   * @param options.minTvl - Minimum TVL filter (default: 100000)
   * @returns Array of yield opportunities sorted by APY
   * 
   * @example
   * const yields = await sdk.yields.getYields({ minApy: 5 });
   * console.log(yields[0]); // { protocol: 'kamino', asset: 'USDC-SOL', apy: 45.2, ... }
   */
  async getYields(options: {
    extended?: boolean;
    minApy?: number;
    minTvl?: number;
  } = {}): Promise<YieldOpportunity[]> {
    const params = new URLSearchParams();
    if (options.extended) params.set('extended', 'true');
    if (options.minApy) params.set('minApy', options.minApy.toString());
    if (options.minTvl) params.set('minTvl', options.minTvl.toString());

    const url = `${this.baseUrl}/api/yields${params.toString() ? '?' + params : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch yields: ${response.statusText}`);
    }

    const data = await response.json() as YieldsResponse;
    return data.yields;
  }

  /**
   * Get the highest yielding opportunity within risk tolerance
   * 
   * @param riskTolerance - Maximum risk level to consider
   * @returns Best yield opportunity or null if none found
   * 
   * @example
   * const best = await sdk.yields.getBestYield('medium');
   * if (best) console.log(`Best: ${best.asset} at ${best.apy}% APY`);
   */
  async getBestYield(
    riskTolerance: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<YieldOpportunity | null> {
    const yields = await this.getYields({ extended: true });
    
    const riskLevels = { low: 1, medium: 2, high: 3 };
    const maxRisk = riskLevels[riskTolerance];
    
    const eligible = yields.filter(y => riskLevels[y.risk] <= maxRisk);
    return eligible[0] || null;
  }

  /**
   * Get AI-powered yield analysis with explainable reasoning
   * 
   * Returns autonomous decision-making output including:
   * - Decision type (hold/rebalance/enter)
   * - Confidence score (0-1)
   * - Step-by-step reasoning
   * - Top opportunities
   * 
   * @returns Autopilot decision with full reasoning
   * 
   * @example
   * const analysis = await sdk.yields.getAutopilotAnalysis();
   * console.log(analysis.decision.reasoning); // ["📊 Found 50 opportunities...", ...]
   * console.log(analysis.decision.recommendation); // "Rebalance into USDC-SOL..."
   */
  async getAutopilotAnalysis(): Promise<AutopilotResponse> {
    const response = await fetch(`${this.baseUrl}/api/autopilot`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch autopilot analysis: ${response.statusText}`);
    }

    return response.json() as Promise<AutopilotResponse>;
  }

  /**
   * Check if a specific protocol is supported for yield tracking
   */
  async isProtocolSupported(protocol: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/yields`);
    const data = await response.json() as YieldsResponse;
    return data.supported_protocols.includes(protocol.toLowerCase());
  }

  /**
   * Get yields filtered by protocol
   * 
   * @param protocol - Protocol name (e.g., 'kamino', 'drift', 'jito')
   * @returns Yields from that protocol only
   */
  async getYieldsByProtocol(protocol: string): Promise<YieldOpportunity[]> {
    const yields = await this.getYields({ extended: true });
    return yields.filter(y => 
      y.protocol.toLowerCase().includes(protocol.toLowerCase())
    );
  }

  /**
   * Get yields for stablecoins only (low risk)
   */
  async getStablecoinYields(): Promise<YieldOpportunity[]> {
    const yields = await this.getYields({ extended: true });
    return yields.filter(y => y.risk === 'low');
  }

  /**
   * Get a summary of current yield landscape
   */
  async getSummary(): Promise<{
    totalOpportunities: number;
    bestApy: number;
    averageApy: number;
    protocols: string[];
  }> {
    const yields = await this.getYields({ extended: true });
    
    const protocols = [...new Set(yields.map(y => y.protocol))];
    const apys = yields.map(y => y.apy);
    
    return {
      totalOpportunities: yields.length,
      bestApy: Math.max(...apys),
      averageApy: apys.reduce((a, b) => a + b, 0) / apys.length,
      protocols,
    };
  }
}
