/**
 * Optimization Algorithm for Community Pledges
 * 
 * This algorithm calculates the optimal payment amounts for pledgers
 * to cover server costs while maximizing savings for the community.
 */

export interface OptimizationResult {
  optimizedAmounts: number[]
  totalPledged: number
  serverCost: number
  savings: number
  isAcceptingPledges: boolean
  maxPeople: number
}

/**
 * Calculate optimized costs based on pledges and server cost
 * 
 * @param pledgeAmounts - Array of pledge amounts from users
 * @param serverCost - Monthly cost of the server
 * @returns OptimizationResult with calculated amounts and metadata
 */
export function calculateOptimizedCosts(
  pledgeAmounts: number[],
  serverCost: number
): OptimizationResult {
  const totalPledged = pledgeAmounts.reduce((sum, amount) => sum + amount, 0)
  
  // If no pledges or cost is 0
  if (pledgeAmounts.length === 0 || serverCost <= 0) {
    return {
      optimizedAmounts: [],
      totalPledged: 0,
      serverCost,
      savings: 0,
      isAcceptingPledges: true,
      maxPeople: Infinity,
    }
  }

  // If overfunded (total pledges exceed cost)
  if (totalPledged >= serverCost) {
    // Calculate how much each person actually pays (proportionally reduced)
    const ratio = serverCost / totalPledged
    const optimizedAmounts = pledgeAmounts.map(amount => 
      Math.round(amount * ratio * 100) / 100
    )
    
    return {
      optimizedAmounts,
      totalPledged,
      serverCost,
      savings: totalPledged - serverCost,
      isAcceptingPledges: false, // Stop accepting new pledges
      maxPeople: pledgeAmounts.length,
    }
  }

  // If underfunded (total pledges < cost)
  // Each person pays their full pledge amount
  const remaining = serverCost - totalPledged
  const minPledge = 2 // Minimum pledge constant
  const maxPossiblePeople = Math.floor(remaining / minPledge) + pledgeAmounts.length

  return {
    optimizedAmounts: pledgeAmounts,
    totalPledged,
    serverCost,
    savings: 0,
    isAcceptingPledges: true,
    maxPeople: maxPossiblePeople,
  }
}

/**
 * Get optimization preview for a potential new pledge
 * 
 * @param pledgeAmounts - Current pledge amounts
 * @param serverCost - Server cost
 * @param newPledgeAmount - New pledge amount to preview
 * @returns Preview with estimated payment and acceptance status
 */
export function getOptimizationPreview(
  pledgeAmounts: number[],
  serverCost: number,
  newPledgeAmount: number
): { estimatedPayment: number; wouldBeAccepted: boolean } {
  const allPledges = [...pledgeAmounts, newPledgeAmount]
  const result = calculateOptimizedCosts(allPledges, serverCost)
  
  return {
    estimatedPayment: result.optimizedAmounts[result.optimizedAmounts.length - 1] || newPledgeAmount,
    wouldBeAccepted: result.isAcceptingPledges,
  }
}

