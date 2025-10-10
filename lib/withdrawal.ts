import { prisma } from './prisma'
import { stripe, calculatePlatformFee, calculateStripeFee, calculateNetAmount } from './stripe'
import { handlePaymentFailure, resetPaymentFailures } from './payment-failure'
import { sendPledgePaymentEmail, sendFailedPaymentEmail, sendSuspensionEmail } from './email'
import { calculateOptimizedCosts } from './optimization'

/**
 * Calculate the next withdrawal date for a server based on its withdrawal day
 * Withdrawals are scheduled 2 days before the server's due date
 */
export function calculateNextWithdrawalDate(withdrawalDay: number): Date {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Calculate the due date for this month
  let dueDate = new Date(currentYear, currentMonth, withdrawalDay)
  
  // If the due date has already passed this month, use next month
  if (dueDate <= now) {
    dueDate = new Date(currentYear, currentMonth + 1, withdrawalDay)
  }
  
  // Calculate withdrawal date (2 days before due date)
  const withdrawalDate = new Date(dueDate)
  withdrawalDate.setDate(dueDate.getDate() - 2)
  
  return withdrawalDate
}

/**
 * Calculate the next withdrawal date for a specific server
 * This takes into account the server's specific withdrawal day
 */
export function calculateServerWithdrawalDate(serverWithdrawalDay: number): Date {
  return calculateNextWithdrawalDate(serverWithdrawalDay)
}

/**
 * Schedule monthly withdrawals for all active servers
 * This should be called by a cron job or scheduled task
 */
export async function scheduleMonthlyWithdrawals() {
  try {
    const activeServers = await prisma.server.findMany({
      where: {
        isActive: true
      },
      include: {
        pledges: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    for (const server of activeServers) {
      const nextWithdrawalDate = calculateServerWithdrawalDate(server.withdrawalDay)
      
      // Check if withdrawal is already scheduled for this month
      const existingWithdrawal = await prisma.withdrawal.findFirst({
        where: {
          serverId: server.id,
          scheduledDate: {
            gte: new Date(nextWithdrawalDate.getFullYear(), nextWithdrawalDate.getMonth(), 1),
            lt: new Date(nextWithdrawalDate.getFullYear(), nextWithdrawalDate.getMonth() + 1, 1)
          }
        }
      })

      if (!existingWithdrawal && server.pledges.length > 0) {
        // Calculate total amount to withdraw based on optimized costs
        const pledgeAmounts = server.pledges.map(p => p.amount)
        const optimization = calculateOptimizedCosts(pledgeAmounts, server.cost)
        const totalWithdrawalAmount = optimization.optimizedAmounts.reduce((sum, cost) => sum + cost, 0)

        await prisma.withdrawal.create({
          data: {
            serverId: server.id,
            amount: totalWithdrawalAmount,
            scheduledDate: nextWithdrawalDate,
            status: 'pending'
          }
        })

        console.log(`Scheduled withdrawal for server ${server.name}: $${totalWithdrawalAmount.toFixed(2)} on ${nextWithdrawalDate.toISOString()}`)
      }
    }
  } catch (error) {
    console.error('Error scheduling monthly withdrawals:', error)
    throw error
  }
}

/**
 * Process pending withdrawals (mark as completed)
 * This should be called by a cron job on the scheduled withdrawal dates
 */
export async function processPendingWithdrawals() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        status: 'pending',
        scheduledDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        server: {
          include: {
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    for (const withdrawal of pendingWithdrawals) {
      // Get server with pledges to calculate individual payments
      const server = await prisma.server.findUnique({
        where: { id: withdrawal.serverId },
        include: {
          pledges: {
            include: {
              user: {
                select: {
                  name: true,
                  stripeAccountId: true
                }
              }
            }
          },
          owner: {
            select: {
              stripeAccountId: true
            }
          }
        }
      })

      if (!server) continue

      // Calculate optimized costs for each pledger
      const pledgeAmounts = server.pledges.map(p => p.amount)
      const optimization = calculateOptimizedCosts(pledgeAmounts, server.cost)
      
      // Process payments for each pledger
      let totalCollected = 0
      let successfulPayments = 0
      
      for (let i = 0; i < server.pledges.length; i++) {
        const pledge = server.pledges[i]
        const actualAmount = optimization.optimizedAmounts[i] || pledge.amount
        
        try {
          // Get user's payment methods
          const user = await prisma.user.findUnique({
            where: { id: pledge.userId },
            select: { 
              stripePaymentMethodId: true, 
              stripeCustomerId: true,
              name: true,
              email: true
            }
          })

          if (!user?.stripePaymentMethodId || !user?.stripeCustomerId) {
            console.log(`User ${pledge.userId} has no Stripe payment method, skipping payment`)
            continue
          }

          // Calculate fees for this payment
          const platformFee = calculatePlatformFee(actualAmount)
          const stripeFee = calculateStripeFee(actualAmount)
          const netAmount = calculateNetAmount(actualAmount)

          let paymentIntent: any = null

          // Process payment via Stripe
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(actualAmount * 100), // Convert to cents
            currency: 'usd',
            customer: user.stripeCustomerId,
            payment_method: user.stripePaymentMethodId,
            confirm: true,
            off_session: true, // CRITICAL: This allows charging without user present
            metadata: {
              serverId: withdrawal.serverId,
              serverOwnerId: withdrawal.server.ownerId,
              payerId: pledge.userId,
              type: 'pledge_payment',
              platformFee: platformFee.toString(),
              stripeFee: stripeFee.toString(),
              netAmount: netAmount.toString()
            }
          })

          if (paymentIntent.status === 'succeeded') {
            totalCollected += actualAmount
            successfulPayments++
            
            // Reset payment failures on successful payment
            await resetPaymentFailures(pledge.userId)
            
            // Update pledge with optimized amount
            await prisma.pledge.update({
              where: { id: pledge.id },
              data: { optimizedAmount: actualAmount },
            })

            // Log successful payment
            await prisma.activityLog.create({
              data: {
                type: 'payment_success',
                message: `Stripe payment of A$${actualAmount.toFixed(2)} processed for "${server.name}" pledge`,
                amount: actualAmount,
                userId: pledge.userId,
                serverId: withdrawal.serverId
              }
            })
            
            // Send payment success email
            try {
              await sendPledgePaymentEmail({
                userName: user.name || 'User',
                userEmail: user.email,
                serverName: server.name,
                pledgeAmount: pledge.amount,
                actualAmount: actualAmount,
                totalPledgers: server.pledges.length,
                currency: 'A$'
              })
            } catch (emailError) {
              console.error('Failed to send payment success email:', emailError)
            }
          } else {
            console.log(`Stripe payment failed for user ${pledge.userId}: ${paymentIntent.status}`)
            
            // Handle payment failure
            const failureResult = await handlePaymentFailure(pledge.userId, `Pledge payment failed: ${paymentIntent.status}`)
            
            // Send failed payment email notification
            try {
              if (failureResult?.isSuspended) {
                // Send suspension email
                await sendSuspensionEmail({
                  userName: user.name || 'User',
                  userEmail: user.email,
                  supportUrl: `${process.env.NEXTAUTH_URL}/tickets`
                })
                console.log(`User ${pledge.userId} suspended due to payment failures`)
              } else {
                // Send failed payment email
                await sendFailedPaymentEmail({
                  userName: user.name || 'User',
                  userEmail: user.email,
                  serverName: server.name,
                  pledgeAmount: pledge.amount,
                  attemptNumber: failureResult?.attemptNumber || 1,
                  currency: 'A$',
                  supportUrl: `${process.env.NEXTAUTH_URL}/tickets`
                })
                console.log(`User ${pledge.userId} has ${failureResult?.remainingAttempts} payment attempts remaining`)
              }
            } catch (emailError) {
              console.error('Failed to send payment failure email:', emailError)
            }
          }
        } catch (error) {
          console.error(`Error processing payment for user ${pledge.userId}:`, error)
        }
      }

      // Distribute payments to server owner via Stripe
      if (totalCollected > 0) {
        // Calculate total platform fees collected from all pledges
        const totalPlatformFees = server.pledges.reduce((total, pledge, index) => {
          const actualAmount = optimization.optimizedAmounts[index] || pledge.amount
          return total + calculatePlatformFee(actualAmount)
        }, 0)
        
        await distributeToServerOwner(server, totalCollected, withdrawal.serverId, totalPlatformFees)
      }

      // Update withdrawal status
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: 'completed',
          processedAt: new Date(),
          amount: totalCollected
        }
      })

      console.log(`Processed withdrawal for server ${withdrawal.server.name}: $${totalCollected.toFixed(2)} (${successfulPayments}/${server.pledges.length} payments successful)`)
      
      // Log deposit activity for server owner
      if (totalCollected > 0) {
        await prisma.activityLog.create({
          data: {
            type: 'deposit_received',
            message: `You received A$${totalCollected.toFixed(2)} from community pledges for "${withdrawal.server.name}"`,
            amount: totalCollected,
            userId: withdrawal.server.ownerId,
            serverId: withdrawal.serverId
          }
        })
      }
    }
  } catch (error) {
    console.error('Error processing pending withdrawals:', error)
    throw error
  }
}


/**
 * Distribute payments to server owner via Stripe
 * Uses Stripe Express accounts for individual server owners
 */
async function distributeToServerOwner(server: any, totalAmount: number, serverId: string, totalPlatformFees: number = 0) {
  try {
    // Get server owner's Stripe payout account
    const owner = await prisma.user.findUnique({
      where: { id: server.ownerId },
      select: {
        id: true,
        stripePayoutAccountId: true,
        stripePayoutConnected: true,
        stripePayoutRequirements: true,
        name: true,
        email: true
      }
    })

    if (!owner) {
      console.error(`Server owner not found for server ${serverId}`)
      return
    }

    // Calculate net amount (total collected minus platform fees already calculated per pledge)
    const netAmount = totalAmount - totalPlatformFees

    if (netAmount <= 0) {
      console.log(`No net amount to distribute for server ${serverId}`)
      return
    }

    // Check if owner has completed Stripe Connect onboarding
    const user = await prisma.user.findUnique({
      where: { id: owner.id },
      select: {
        stripeAccountId: true,
        stripeOnboardingComplete: true,
      },
    })

    if (user?.stripeAccountId && user?.stripeOnboardingComplete) {
      // Server owner has Stripe Connect - process payout
      await distributeToStripe(owner, netAmount, serverId, server.name, user.stripeAccountId)
    } else {
      // No Stripe payout configured - hold funds for manual processing
      console.log(`No Stripe Connect account configured for server owner ${owner.name} - holding A$${netAmount.toFixed(2)} for manual processing`)
      
      // Log pending payout
      await prisma.activityLog.create({
        data: {
          type: 'payout_pending',
          message: `A$${netAmount.toFixed(2)} pending payout for "${server.name}" - Stripe payout account required`,
          amount: netAmount,
          userId: owner.id,
          serverId: serverId
        }
      })
    }
  } catch (error) {
    console.error(`Error distributing payment to server owner:`, error)
    throw error
  }
}

/**
 * Distribute payment to server owner via Stripe Connect
 * Uses Stripe's transfer API to send money to the server owner's Connect account
 */
async function distributeToStripe(owner: any, amount: number, serverId: string, serverName: string, stripeAccountId: string) {
  try {
    if (!stripeAccountId) {
      throw new Error('No Stripe Connect account ID found')
    }

    // Create transfer to server owner's Stripe Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd', // Changed to USD for consistency
      destination: stripeAccountId,
      metadata: {
        serverId: serverId,
        serverName: serverName,
        type: 'server_payout'
      }
    })

    console.log(`Stripe transfer successful: ${transfer.id}`)
    
    // Log successful payout
    await prisma.activityLog.create({
      data: {
        type: 'stripe_payout_success',
        message: `A$${amount.toFixed(2)} sent to your Stripe account for "${serverName}"`,
        amount: amount,
        userId: owner.id,
        serverId: serverId
      }
    })

    // Store transfer ID for tracking
    await prisma.activityLog.create({
      data: {
        type: 'stripe_transfer_id',
        message: `Stripe Transfer ID: ${transfer.id}`,
        userId: owner.id,
        serverId: serverId
      }
    })

  } catch (error) {
    console.error(`Error distributing Stripe payment:`, error)
    
    // Log failed payout
    await prisma.activityLog.create({
      data: {
        type: 'stripe_payout_failed',
        message: `Stripe payout failed for "${serverName}": ${error instanceof Error ? error.message : String(error)}`,
        amount: amount,
        userId: owner.id,
        serverId: serverId
      }
    })
  }
}

/**
 * Create Stripe Express account for server owner
 * This initiates the Stripe Express onboarding process
 */
export async function createStripeExpressAccount(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'AU', // Australia
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      individual: {
        email: user.email,
        first_name: user.name?.split(' ')[0] || 'Server',
        last_name: user.name?.split(' ').slice(1).join(' ') || 'Owner'
      }
    })

    // Update user with Stripe Express account ID
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripePayoutAccountId: account.id,
        stripePayoutConnected: false, // Will be true after onboarding
        stripePayoutRequirements: JSON.stringify(account.requirements)
      }
    })

    return {
      success: true,
      accountId: account.id,
      requirements: account.requirements
    }
  } catch (error) {
    console.error('Error creating Stripe Express account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create Stripe Express account link for onboarding
 * This generates a URL for the user to complete their Stripe Express setup
 */
export async function createStripeExpressAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    })

    return {
      success: true,
      url: accountLink.url
    }
  } catch (error) {
    console.error('Error creating Stripe Express account link:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check Stripe Express account status
 * This verifies if the account is ready to receive payouts
 */
export async function checkStripeExpressAccountStatus(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId)
    
    return {
      success: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements
    }
  } catch (error) {
    console.error('Error checking Stripe Express account status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
