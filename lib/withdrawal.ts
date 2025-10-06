import { prisma } from './prisma'
import { stripe, calculatePlatformFee, calculateStripeFee, calculateNetAmount } from './stripe'
import { handlePaymentFailure, resetPaymentFailures } from './payment-failure'
import { sendPledgePaymentEmail, sendFailedPaymentEmail, sendSuspensionEmail } from './email'

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
        const optimizedCosts = calculateOptimizedCosts(pledgeAmounts, server.cost, 2.0)
        const totalWithdrawalAmount = optimizedCosts.optimizedCosts.reduce((sum, cost) => sum + cost, 0)

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
      const optimizedCosts = calculateOptimizedCosts(pledgeAmounts, server.cost, 2.0)
      
      // Process payments for each pledger
      let totalCollected = 0
      let successfulPayments = 0
      
      for (let i = 0; i < server.pledges.length; i++) {
        const pledge = server.pledges[i]
        const actualAmount = optimizedCosts.optimizedCosts[i] || pledge.amount
        
        try {
          // Get user's payment methods
          const user = await prisma.user.findUnique({
            where: { id: pledge.userId },
            select: { 
              stripePaymentMethodId: true, 
              stripeCustomerId: true,
              payoutPaypalEmail: true,
              payoutPaypalConnected: true,
              name: true,
              email: true
            }
          })

          if (!user?.stripePaymentMethodId && !user?.payoutPaypalConnected) {
            console.log(`User ${pledge.userId} has no payment method, skipping payment`)
            continue
          }

          // Calculate fees for this payment
          const platformFee = calculatePlatformFee(actualAmount)
          const stripeFee = calculateStripeFee(actualAmount)
          const netAmount = calculateNetAmount(actualAmount)

          let paymentIntent: any = null

          // Process payment based on user's payment method preference
          if (user.stripePaymentMethodId && user.stripeCustomerId) {
            // User has card payment method - process through Stripe
            paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(actualAmount * 100), // Convert to cents
              currency: 'aud',
              customer: user.stripeCustomerId,
              payment_method: user.stripePaymentMethodId,
              confirm: true,
              metadata: {
                serverId: withdrawal.serverId,
                serverOwnerId: withdrawal.server.ownerId,
                payerId: pledge.userId,
                type: 'pledge_payment',
                paymentMethod: 'card',
                platformFee: platformFee.toString(),
                stripeFee: stripeFee.toString(),
                netAmount: netAmount.toString()
              }
            })
          } else if (user.payoutPaypalConnected) {
            // User has PayPal - process payment via PayPal API
            try {
              const paypalResult = await processPayPalPayment(user, actualAmount, withdrawal.serverId, server.name, pledge.userId)
              
              if (paypalResult.success) {
                totalCollected += actualAmount
                successfulPayments++
                
                // Reset payment failures on successful payment
                await resetPaymentFailures(pledge.userId)
                
                // Log successful payment
                await prisma.activityLog.create({
                  data: {
                    type: 'payment_processed',
                    message: `PayPal payment of A$${actualAmount.toFixed(2)} processed for "${server.name}" pledge`,
                    amount: actualAmount,
                    userId: pledge.userId,
                    serverId: withdrawal.serverId
                  }
                })
                
                // Send email notification for successful payment
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
                
                // Create a mock successful payment intent for consistency
                paymentIntent = { status: 'succeeded' }
              } else {
                console.log(`PayPal payment failed for user ${pledge.userId}: ${paypalResult.error}`)
                
                // Handle payment failure
                const failureResult = await handlePaymentFailure(pledge.userId, `PayPal payment failed: ${paypalResult.error}`)
                
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
                
                // Create a mock failed payment intent for consistency
                paymentIntent = { status: 'failed' }
              }
            } catch (error) {
              console.error(`Error processing PayPal payment for user ${pledge.userId}:`, error)
              
              // Handle payment failure
              const errorMessage = error instanceof Error ? error.message : String(error)
              const failureResult = await handlePaymentFailure(pledge.userId, `PayPal payment error: ${errorMessage}`)
              
              // Send failed payment email notification
              try {
                if (failureResult?.isSuspended) {
                  // Send suspension email
                  await sendSuspensionEmail({
                    userName: user.name || 'User',
                    userEmail: user.email,
                    supportUrl: `${process.env.NEXTAUTH_URL}/tickets`
                  })
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
                }
              } catch (emailError) {
                console.error('Failed to send payment failure email:', emailError)
              }
              
              // Create a mock failed payment intent for consistency
              paymentIntent = { status: 'failed' }
            }
          }

          // Payment processing is now handled within the if/else blocks above
          // This section is kept for Stripe card payments only
          if (user.stripePaymentMethodId && user.stripeCustomerId && paymentIntent.status === 'succeeded') {
            totalCollected += actualAmount
            successfulPayments++
            
            // Reset payment failures on successful payment
            await resetPaymentFailures(pledge.userId)
            
            // Log successful payment
            await prisma.activityLog.create({
              data: {
                type: 'payment_processed',
                message: `Payment of A$${actualAmount.toFixed(2)} processed for "${server.name}" pledge`,
                amount: actualAmount,
                userId: pledge.userId,
                serverId: withdrawal.serverId
              }
            })
            
            // Send email notification for successful payment
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
          } else if (user.stripePaymentMethodId && user.stripeCustomerId && paymentIntent.status !== 'succeeded') {
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

      // Distribute payments to server owner based on their payout method
      if (totalCollected > 0) {
        await distributeToServerOwner(server, totalCollected, withdrawal.serverId)
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
            message: `You received $${totalCollected.toFixed(2)} from community pledges for "${withdrawal.server.name}"`,
            amount: totalCollected,
            userId: withdrawal.server.ownerId,
            serverId: withdrawal.serverId
          }
        })
      }
      
      // TODO: Send notification to server owner about successful withdrawal
      // TODO: Send notification to pledgers about their payment being processed
    }
  } catch (error) {
    console.error('Error processing pending withdrawals:', error)
    throw error
  }
}

/**
 * Calculate optimized costs for withdrawal amount
 * This is a simplified version of the main algorithm
 */
function calculateOptimizedCosts(pledgeAmounts: number[], serverCost: number, minCostPerPerson: number) {
  const totalPledged = pledgeAmounts.reduce((sum, amount) => sum + amount, 0)
  const pledgeCount = pledgeAmounts.length
  
  if (pledgeCount === 0) {
    return { optimizedCosts: [] }
  }
  
  if (totalPledged < serverCost) {
    return { optimizedCosts: pledgeAmounts }
  }
  
  // If total pledged >= server cost, optimize distribution
  let optimizedCosts = [...pledgeAmounts]
  let excess = totalPledged - serverCost
  
  // Create array of indices sorted by pledge amount (highest first)
  const sortedIndices = pledgeAmounts
    .map((amount, index) => ({ amount, index }))
    .sort((a, b) => b.amount - a.amount)
    .map(item => item.index)
  
  // Phase 1: Balance among top pledgers
  for (let i = 0; i < sortedIndices.length - 1 && excess > 0; i++) {
    const currentIndex = sortedIndices[i]
    const nextIndex = sortedIndices[i + 1]
    
    const currentCost = optimizedCosts[currentIndex]
    const nextCost = optimizedCosts[nextIndex]
    
    if (currentCost > nextCost) {
      const difference = currentCost - nextCost
      const reduction = Math.min(excess, difference)
      
      optimizedCosts[currentIndex] = currentCost - reduction
      excess -= reduction
    }
  }
  
  // Phase 2: Distribute remaining excess
  for (const index of sortedIndices) {
    if (excess <= 0) break
    
    const currentCost = optimizedCosts[index]
    const maxReduction = currentCost - minCostPerPerson
    
    if (maxReduction > 0) {
      const reduction = Math.min(excess, maxReduction)
      optimizedCosts[index] = currentCost - reduction
      excess -= reduction
    }
  }
  
  return { optimizedCosts }
}

/**
 * Distribute payments to server owner via PayPal
 * All payments are processed through the business Stripe account first, then distributed via PayPal
 */
async function distributeToServerOwner(server: any, totalAmount: number, serverId: string) {
  try {
    // Get server owner's PayPal email
    const owner = await prisma.user.findUnique({
      where: { id: server.ownerId },
      select: {
        id: true,
        payoutPaypalEmail: true,
        payoutPaypalConnected: true,
        name: true,
        email: true
      }
    })

    if (!owner) {
      console.error(`Server owner not found for server ${serverId}`)
      return
    }

    // Calculate platform fee and net amount
    const platformFee = calculatePlatformFee(totalAmount)
    const netAmount = totalAmount - platformFee

    if (owner.payoutPaypalConnected) {
      // Server owner has PayPal - process via PayPal
      await distributeToPayPal(owner, netAmount, serverId, server.name)
    } else {
      // No PayPal configured - hold funds for manual processing
      console.log(`No PayPal account configured for server owner ${owner.name} - holding $${netAmount.toFixed(2)} for manual processing`)
      
      await prisma.activityLog.create({
        data: {
          type: 'payout_pending',
          message: `$${netAmount.toFixed(2)} pending payout for "${server.name}" - PayPal account required`,
          amount: netAmount,
          userId: owner.id,
          serverId: serverId
        }
      })
    }
  } catch (error) {
    console.error(`Error distributing payment to server owner:`, error)
  }
}

/**
 * Distribute payment to server owner via PayPal
 * In a real implementation, this would integrate with PayPal API
 */
async function distributeToPayPal(owner: any, amount: number, serverId: string, serverName: string) {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      console.error('PayPal credentials not configured')
      await prisma.activityLog.create({
        data: {
          type: 'paypal_payout_failed',
          message: `PayPal payout failed: PayPal not configured for "${serverName}"`,
          amount: amount,
          userId: owner.id,
          serverId: serverId
        }
      })
      return
    }

    // Get PayPal access token
    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      throw new Error(`PayPal token request failed: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Create PayPal payout
    const payoutData = {
      sender_batch_header: {
        sender_batch_id: `payout_${serverId}_${Date.now()}`,
        email_subject: `Payment from Community Pledges - ${serverName}`,
        email_message: `You have received a payment of A$${amount.toFixed(2)} from Community Pledges for your server "${serverName}". Thank you for using our platform!`
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: amount.toFixed(2),
            currency: 'AUD'
          },
          receiver: owner.payoutPaypalEmail,
          note: `Payment for server: ${serverName}`,
          sender_item_id: `server_${serverId}_${Date.now()}`
        }
      ]
    }

    const payoutResponse = await fetch('https://api-m.paypal.com/v1/payments/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payoutData)
    })

    if (!payoutResponse.ok) {
      const errorData = await payoutResponse.json()
      throw new Error(`PayPal payout failed: ${JSON.stringify(errorData)}`)
    }

    const payoutResult = await payoutResponse.json()
    console.log(`PayPal payout successful: ${payoutResult.batch_header.payout_batch_id}`)
    
    // Log successful payout
    await prisma.activityLog.create({
      data: {
        type: 'paypal_payout_success',
        message: `A$${amount.toFixed(2)} sent to your PayPal account (${owner.payoutPaypalEmail}) for "${serverName}"`,
        amount: amount,
        userId: owner.id,
        serverId: serverId
      }
    })

    // Store payout batch ID for tracking
    await prisma.activityLog.create({
      data: {
        type: 'paypal_payout_batch',
        message: `PayPal Batch ID: ${payoutResult.batch_header.payout_batch_id}`,
        userId: owner.id,
        serverId: serverId
      }
    })

  } catch (error) {
    console.error(`Error distributing PayPal payment:`, error)
    
    // Log failed payout
    await prisma.activityLog.create({
      data: {
        type: 'paypal_payout_failed',
        message: `PayPal payout failed for "${serverName}": ${error instanceof Error ? error.message : String(error)}`,
        amount: amount,
        userId: owner.id,
        serverId: serverId
      }
    })
  }
}

/**
 * Process PayPal payment for pledge
 * Uses PayPal Payments API to charge the user's PayPal account
 */
async function processPayPalPayment(user: any, amount: number, serverId: string, serverName: string, userId: string) {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return { success: false, error: 'PayPal credentials not configured' }
    }

    // Get PayPal access token
    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      return { success: false, error: `PayPal token request failed: ${tokenResponse.status}` }
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Create PayPal payment
    const paymentData = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal',
        payer_info: {
          email: user.payoutPaypalEmail
        }
      },
      transactions: [
        {
          amount: {
            total: amount.toFixed(2),
            currency: 'AUD',
            details: {
              subtotal: amount.toFixed(2)
            }
          },
          description: `Community Pledge Payment for ${serverName}`,
          custom: `server_${serverId}_user_${userId}`,
          invoice_number: `pledge_${serverId}_${userId}_${Date.now()}`
        }
      ],
      redirect_urls: {
        return_url: `${process.env.NEXTAUTH_URL}/api/paypal/payment/success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/api/paypal/payment/cancel`
      }
    }

    const paymentResponse = await fetch('https://api-m.paypal.com/v1/payments/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      return { success: false, error: `PayPal payment creation failed: ${JSON.stringify(errorData)}` }
    }

    const paymentResult = await paymentResponse.json()
    
    // For automated processing, we'll simulate approval
    // In a real implementation, you might need to handle the approval flow
    // For now, we'll assume the payment is approved and execute it
    
    const executeData = {
      payer_id: paymentResult.payer.payer_info.payer_id
    }

    const executeResponse = await fetch(`https://api-m.paypal.com/v1/payments/payment/${paymentResult.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(executeData)
    })

    if (!executeResponse.ok) {
      const errorData = await executeResponse.json()
      return { success: false, error: `PayPal payment execution failed: ${JSON.stringify(errorData)}` }
    }

    const executeResult = await executeResponse.json()
    
    if (executeResult.state === 'approved') {
      console.log(`PayPal payment successful: ${executeResult.id}`)
      return { success: true, paymentId: executeResult.id }
    } else {
      return { success: false, error: `PayPal payment not approved: ${executeResult.state}` }
    }

  } catch (error) {
    console.error(`Error processing PayPal payment:`, error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
