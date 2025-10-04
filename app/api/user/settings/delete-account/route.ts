import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user details for email notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        servers: {
          select: {
            id: true,
            name: true,
            pledges: {
              select: {
                id: true,
                userId: true
              }
            }
          }
        },
        pledges: {
          select: {
            id: true,
            serverId: true,
            server: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Start a transaction to ensure all deletions succeed or none do
    await prisma.$transaction(async (tx) => {
      // 1. Delete all pledges made by this user
      await tx.pledge.deleteMany({
        where: { userId: userId }
      })

      // 2. Delete all pledges to servers owned by this user
      const serverIds = user.servers.map(server => server.id)
      if (serverIds.length > 0) {
        await tx.pledge.deleteMany({
          where: { serverId: { in: serverIds } }
        })
      }

      // 3. Delete all servers owned by this user
      await tx.server.deleteMany({
        where: { ownerId: userId }
      })

      // 4. Delete all activity logs for this user
      await tx.activityLog.deleteMany({
        where: { userId: userId }
      })

      // 5. Delete all tickets created by this user
      await tx.ticket.deleteMany({
        where: { createdById: userId }
      })

      // 6. Delete all favorites for this user
      await tx.favorite.deleteMany({
        where: { userId: userId }
      })

      // 7. Finally, delete the user account
      await tx.user.delete({
        where: { id: userId }
      })
    })

    // Log the account deletion
    console.log(`[Account Deletion] User ${user.email} (${user.name}) deleted their account`)

    // Send email notification to user (if email service is configured)
    try {
      const deletionEmail = {
        subject: 'Account Deleted - Community Pledges',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Deleted</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
              .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🗑️ Account Deleted</h1>
              <p>Your Community Pledges account has been permanently deleted</p>
            </div>
            
            <div class="content">
              <h2>Hello ${user.name || 'User'}!</h2>
              
              <div class="info">
                <h3>Account Deletion Confirmed</h3>
                <p>Your Community Pledges account was permanently deleted on <strong>${new Date().toLocaleString()}</strong>.</p>
              </div>
              
              <div class="warning">
                <h3>What Was Deleted</h3>
                <ul>
                  <li>Your user account and profile</li>
                  <li>All servers you created (${user.servers.length} server${user.servers.length === 1 ? '' : 's'})</li>
                  <li>All pledges you made to other servers (${user.pledges.length} pledge${user.pledges.length === 1 ? '' : 's'})</li>
                  <li>All pledges made to your servers</li>
                  <li>All activity logs</li>
                  <li>All support tickets</li>
                  <li>All favorite servers</li>
                </ul>
              </div>
              
              <p><strong>Important:</strong> This action cannot be undone. If you wish to use Community Pledges again in the future, you will need to create a new account.</p>
              
              <p>Thank you for using Community Pledges. We're sorry to see you go!</p>
              
              <div class="footer">
                <p>This is an automated notification from Community Pledges.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Account Deleted - Community Pledges
          
          Hello ${user.name || 'User'}!
          
          Your Community Pledges account was permanently deleted on ${new Date().toLocaleString()}.
          
          What Was Deleted:
          - Your user account and profile
          - All servers you created (${user.servers.length} server${user.servers.length === 1 ? '' : 's'})
          - All pledges you made to other servers (${user.pledges.length} pledge${user.pledges.length === 1 ? '' : 's'})
          - All pledges made to your servers
          - All activity logs
          - All support tickets
          - All favorite servers
          
          Important: This action cannot be undone. If you wish to use Community Pledges again in the future, you will need to create a new account.
          
          Thank you for using Community Pledges. We're sorry to see you go!
          
          This is an automated notification from Community Pledges.
        `
      }

      await sendEmail(user.email, deletionEmail)
    } catch (emailError) {
      console.error('Failed to send account deletion email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      message: 'Account deleted successfully' 
    })

  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { message: 'Failed to delete account. Please try again.' },
      { status: 500 }
    )
  }
}
