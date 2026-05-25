import Link from "next/link"
import { ReactNode } from "react"
import { SUPPORTED_COUNTRIES } from "@/lib/countries"
import { Metadata } from "next"
import {
  ClipboardList,
  Landmark,
  IdCard,
  Receipt,
  Lightbulb,
  CircleDollarSign,
  Clock,
  Globe,
  BarChart3,
  Wallet,
  Calendar,
  Coins,
  Eye,
  Zap,
  FileText,
  Wrench,
  MapPin,
  Mail,
  User,
  Building2,
} from "lucide-react"
import HelpArticleLayout from "@/components/help/HelpArticleLayout"
import {
  HelpSection,
  HelpSubheading,
  HelpCard,
  HelpCallout,
  HelpBulletList,
  HelpCheckList,
  HelpFieldTip,
  HelpStep,
} from "@/components/help/HelpBlocks"

export const metadata: Metadata = {
  title: "Stripe Payout Setup Guide - Community Pledges | How to Receive Payments",
  description:
    "Complete guide to setting up Stripe Connect for receiving payouts from server pledges. Learn about daily payouts, country requirements, tax reporting, and troubleshooting.",
  keywords:
    "stripe setup, stripe connect, receive payouts, gaming server payments, stripe individual account, daily payouts, stripe onboarding",
}

function CountryBlock({
  name,
  children,
}: {
  name: string
  children: ReactNode
}) {
  return (
    <HelpCard className="mb-6">
      <HelpSubheading title={name} icon={MapPin} />
      <div className="space-y-3 text-sm">{children}</div>
    </HelpCard>
  )
}

export default function StripeSetupHelpPage() {
  return (
    <HelpArticleLayout
      title="Stripe Payout Setup"
      subtitle="Complete guide for setting up your payout method to receive donations"
      backHref="/settings"
      backLabel="Back to Settings"
    >
      <HelpSection title="Overview">
        <p className="help-article__text">
          To receive donations from players, you need to connect a Stripe account. We use{" "}
          <strong>Stripe Connect Express</strong> which allows you to receive payments{" "}
          <strong>as an individual</strong> — no business registration required.
        </p>
        <HelpCallout>
          Even though Stripe asks for &quot;business&quot; information, you&apos;re setting this up as an{" "}
          <strong>individual</strong>. The business questions are for regulatory compliance, not because you need to register a business.
        </HelpCallout>
      </HelpSection>

      <HelpSection title="What You'll Need">
        <div className="grid md:grid-cols-2 gap-4">
          <HelpCard>
            <HelpSubheading title="Personal Information" icon={ClipboardList} />
            <HelpBulletList
              items={[
                "Your legal name (first & last)",
                "Date of birth",
                "Home address",
                "Phone number",
              ]}
            />
          </HelpCard>
          <HelpCard>
            <HelpSubheading title="Banking Details" icon={Landmark} />
            <HelpBulletList
              items={[
                "Personal bank account",
                "Account number",
                "Routing/sort code (country-specific)",
              ]}
            />
          </HelpCard>
          <HelpCard>
            <HelpSubheading title="Identification" icon={IdCard} />
            <HelpBulletList
              items={[
                "Government-issued photo ID",
                "Driver's license or passport",
                "Clear, readable photo",
              ]}
            />
          </HelpCard>
          <HelpCard>
            <HelpSubheading title="Tax Information" icon={Receipt} />
            <HelpBulletList
              items={[
                "Tax ID (SSN, TFN, etc.)",
                "Usually optional initially",
                "Required for larger amounts",
              ]}
            />
          </HelpCard>
        </div>
      </HelpSection>

      <HelpSection title="How to Fill Out the Form">
        <div className="space-y-4">
          <HelpFieldTip title="Legal Business Name">
            <strong>Enter your personal name</strong> (e.g., &quot;John Smith&quot;). NOT a business name. This is your legal name as an individual.
          </HelpFieldTip>
          <HelpFieldTip title="Business Name (DBA) / Doing Business As">
            <strong>Leave blank</strong> or enter your server name. This is optional. Use it if you want donations to show a specific name.
          </HelpFieldTip>
          <HelpFieldTip title="Business Registration Number">
            <strong>Leave blank if you don&apos;t have one</strong> (ABN in Australia, EIN in US, etc.) — only fill if you have one. Most individuals don&apos;t need this.
          </HelpFieldTip>
          <HelpFieldTip title="Business Address">
            <strong>Use your home address.</strong> This is where you&apos;ll receive tax documents and official correspondence.
          </HelpFieldTip>
          <HelpFieldTip title="Industry">
            <strong>Select:</strong> &quot;Charitable and Social Service Organizations&quot; or &quot;Membership Organizations&quot;. This categorizes your activity as donations/community support.
          </HelpFieldTip>
          <HelpFieldTip title="Business Website">
            <strong>Enter:</strong> <code>https://commpledge.vercel.app</code> or your server&apos;s website if you have one.
          </HelpFieldTip>
        </div>
      </HelpSection>

      <HelpSection title="Country-Specific Requirements" icon={Globe}>
        <CountryBlock name="Australia">
          <div>
            <strong>Bank Account:</strong>
            <HelpBulletList items={["BSB number (6 digits)", "Account number (6-10 digits)"]} />
          </div>
          <div>
            <strong>Tax Information:</strong>
            <HelpBulletList
              items={[
                "Tax File Number (TFN) — optional for small amounts",
                "ABN — only if you have one (not required for individuals)",
              ]}
            />
          </div>
          <div>
            <strong>ID Verification:</strong>
            <HelpBulletList items={["Australian driver's license, OR", "Australian passport"]} />
          </div>
          <HelpCallout label="Note">
            You don&apos;t need an ABN to receive donations as an individual. Only provide it if you already have one for other reasons.
          </HelpCallout>
        </CountryBlock>

        <CountryBlock name="United States">
          <div>
            <strong>Bank Account:</strong>
            <HelpBulletList items={["Routing number (9 digits)", "Account number"]} />
          </div>
          <div>
            <strong>Tax Information:</strong>
            <HelpBulletList
              items={[
                "Social Security Number (SSN) — required",
                "EIN — only if you have a business (not needed for individuals)",
              ]}
            />
          </div>
          <div>
            <strong>ID Verification:</strong>
            <HelpBulletList items={["State-issued driver's license, OR", "US passport"]} />
          </div>
        </CountryBlock>

        <CountryBlock name="United Kingdom">
          <div>
            <strong>Bank Account:</strong>
            <HelpBulletList items={["Sort code (6 digits)", "Account number (8 digits)"]} />
          </div>
          <div>
            <strong>Tax Information:</strong>
            <HelpBulletList
              items={[
                "National Insurance number — optional initially",
                "UTR (Unique Taxpayer Reference) — only if self-employed",
              ]}
            />
          </div>
          <div>
            <strong>ID Verification:</strong>
            <HelpBulletList items={["UK driver's license, OR", "UK passport"]} />
          </div>
        </CountryBlock>

        <CountryBlock name="Canada">
          <div>
            <strong>Bank Account:</strong>
            <HelpBulletList
              items={["Institution number (3 digits)", "Transit number (5 digits)", "Account number"]}
            />
          </div>
          <div>
            <strong>Tax Information:</strong>
            <HelpBulletList
              items={[
                "Social Insurance Number (SIN) — required",
                "Business Number — only if you have a registered business",
              ]}
            />
          </div>
          <div>
            <strong>ID Verification:</strong>
            <HelpBulletList items={["Canadian driver's license, OR", "Canadian passport"]} />
          </div>
        </CountryBlock>

        <CountryBlock name="European Union Countries">
          <p className="help-article__text text-sm mb-3">
            (Germany, France, Spain, Italy, Netherlands, etc.)
          </p>
          <div>
            <strong>Bank Account:</strong>
            <HelpBulletList items={["IBAN (International Bank Account Number)", "BIC/SWIFT code (for some banks)"]} />
          </div>
          <div>
            <strong>Tax Information:</strong>
            <HelpBulletList
              items={[
                "VAT ID — only if you have a business (most individuals don't)",
                "Tax ID varies by country (optional initially)",
              ]}
            />
          </div>
          <div>
            <strong>ID Verification:</strong>
            <HelpBulletList items={["National ID card, OR", "Passport from your country"]} />
          </div>
        </CountryBlock>

        <HelpCard>
          <HelpSubheading title="Other Supported Countries" icon={Globe} />
          <p className="help-article__text text-sm mb-3">Requirements vary by country but generally include:</p>
          <HelpBulletList
            items={[
              "Personal bank account in your country",
              "Government-issued photo ID",
              "Tax ID (if required by your country)",
              "Proof of address (sometimes)",
            ]}
          />
          <p className="help-article__text text-xs mt-4">
            <strong>Supported countries:</strong>{" "}
            {SUPPORTED_COUNTRIES.map((c) => c.name).join(", ")}
          </p>
        </HelpCard>
      </HelpSection>

      <HelpSection title="Step-by-Step Instructions">
        <div className="space-y-4">
          <HelpStep number={1} title="Personal Details">
            Enter your <strong>personal name</strong> (not a business name). Use your legal name exactly as it appears on your ID.
          </HelpStep>
          <HelpStep number={2} title="Business Information (Fill as Individual)">
            <p className="mb-2">Even though it says &quot;business,&quot; fill it as an individual:</p>
            <HelpBulletList
              items={[
                <>
                  <strong>Legal name:</strong> Your personal name
                </>,
                <>
                  <strong>DBA:</strong> Leave blank or use your server name
                </>,
                <>
                  <strong>Registration number:</strong> Leave blank (unless you have ABN/EIN)
                </>,
                <>
                  <strong>Address:</strong> Your home address
                </>,
                <>
                  <strong>Industry:</strong> Select &quot;Charitable&quot; or &quot;Membership Organizations&quot;
                </>,
                <>
                  <strong>Website:</strong> Enter <code>commpledge.vercel.app</code>
                </>,
              ]}
            />
          </HelpStep>
          <HelpStep number={3} title="Banking Information">
            Enter your <strong>personal bank account</strong> details. This is where you&apos;ll receive payouts.
          </HelpStep>
          <HelpStep number={4} title="Identity Verification">
            Upload a clear photo of your government-issued ID. Make sure all text is readable.
          </HelpStep>
          <HelpStep number={5} title="Review and Submit">
            Review all information carefully. Stripe will verify your details and activate your account, usually within 24-48 hours.
          </HelpStep>
        </div>
      </HelpSection>

      <HelpSection title="Common Questions">
        <div className="space-y-4">
          <HelpFieldTip title="Why does it ask for business information?">
            Financial regulations require Stripe to collect certain information about any economic activity. Even as an individual, you need to declare what you&apos;re receiving money for. Just fill it with your personal details.
          </HelpFieldTip>
          <HelpFieldTip title="Do I need to register a business?">
            <strong>No.</strong> You can operate as an individual. Leave business registration fields blank unless you already have a registered business.
          </HelpFieldTip>
          <HelpFieldTip title="Do I need a business bank account?">
            <strong>No.</strong> Use your personal bank account. The money will be deposited there.
          </HelpFieldTip>
          <HelpFieldTip title="What about taxes?">
            Stripe will report your earnings to tax authorities (IRS in US, ATO in Australia, etc.). You&apos;re responsible for declaring this as income. Consult a tax professional for specific advice.
          </HelpFieldTip>
          <HelpFieldTip title="How long does verification take?">
            Usually 24-48 hours. Sometimes instant if all information is clear. You&apos;ll receive an email when approved.
          </HelpFieldTip>
          <HelpFieldTip title="When will I receive payouts?">
            <p className="mb-2">After verification completes, payouts are automatic:</p>
            <HelpBulletList
              items={[
                "Default: Daily (for verified accounts)",
                "New accounts: 7-14 day rolling basis initially",
                "Changes to daily after processing history",
              ]}
            />
          </HelpFieldTip>
          <HelpFieldTip title="Is there a minimum payout amount?">
            Varies by country. Usually $1-25 USD equivalent. Stripe will hold funds until minimum is reached.
          </HelpFieldTip>
        </div>
      </HelpSection>

      <HelpSection title="Tips for Success" icon={Lightbulb}>
        <HelpCheckList
          items={[
            <>
              Use your <strong>personal name</strong> everywhere, not a business name
            </>,
            "Make sure your ID is clear and all text is readable",
            "Double-check your bank details — errors delay payouts",
            <>
              Leave business registration fields <strong>blank</strong> if you don&apos;t have them
            </>,
            "Complete all required fields — incomplete forms delay approval",
            "Check your email — Stripe may ask for additional verification",
          ]}
        />
      </HelpSection>

      <HelpSection title="Understanding Payouts" icon={CircleDollarSign}>
        <HelpCard className="mb-6">
          <HelpSubheading title="How Payouts Work" />
          <p className="help-article__text text-sm mb-4">
            When someone donates to your server, the money goes through this process:
          </p>
          <div className="space-y-3">
            <HelpStep number={1} title="Donation Made">
              Player donates via saved card → Payment captured by Stripe
            </HelpStep>
            <HelpStep number={2} title="Platform Fee Deducted">
              5% platform fee taken (Stripe fees separate)
            </HelpStep>
            <HelpStep number={3} title="Added to Balance">
              95% of donation added to your Stripe balance
            </HelpStep>
            <HelpStep number={4} title="Automatic Payout">
              Stripe automatically transfers to your bank account
            </HelpStep>
          </div>
        </HelpCard>

        <HelpSubheading title="Payout Timeline" icon={Clock} />
        <div className="space-y-4 mb-6">
          <HelpCard>
            <h4 className="font-semibold mb-2">New Accounts (First 2-4 weeks)</h4>
            <p className="help-article__text text-sm mb-2">
              When you first connect Stripe, there&apos;s an initial holding period for security:
            </p>
            <HelpBulletList
              items={[
                <>
                  <strong>First payout:</strong> 7-14 days after first donation
                </>,
                <>
                  <strong>Reason:</strong> Fraud protection and account verification
                </>,
                <>
                  <strong>What happens:</strong> Funds accumulate, then first payout includes everything
                </>,
              ]}
            />
          </HelpCard>
          <HelpCard>
            <h4 className="font-semibold mb-2">Established Accounts (After Initial Period)</h4>
            <p className="help-article__text text-sm mb-2">
              Once your account is established, payouts become automatic and fast:
            </p>
            <HelpBulletList
              items={[
                <>
                  <strong>Schedule:</strong> Daily automatic payouts
                </>,
                <>
                  <strong>Timeline:</strong> 2-3 business days to your bank
                </>,
                <>
                  <strong>Example:</strong> Donation Monday → In your bank Wednesday/Thursday
                </>,
              ]}
            />
          </HelpCard>
        </div>

        <HelpSubheading title="Payout Times by Country" icon={Globe} />
        <div className="overflow-x-auto mb-6">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Payout Time</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Australia", "2-3 business days", "Direct deposit"],
                ["United States", "2 business days", "ACH transfer"],
                ["United Kingdom", "2-3 business days", "Faster Payments"],
                ["Canada", "3-5 business days", "EFT transfer"],
                ["EU Countries", "2-4 business days", "SEPA transfer"],
                ["Singapore", "3-7 business days", "PayNow/GIRO"],
                ["Other countries", "3-7 business days", "Local transfer"],
              ].map(([country, time, method]) => (
                <tr key={country}>
                  <td>{country}</td>
                  <td>{time}</td>
                  <td>{method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <HelpSubheading title="How to Check Your Payouts" icon={BarChart3} />
        <div className="space-y-4 mb-6">
          <HelpCard>
            <h4 className="font-semibold mb-2">Method 1: Stripe Dashboard (Most Detailed)</h4>
            <ol className="list-decimal list-inside text-sm space-y-2 ml-2 help-article__text">
              <li>
                Go to{" "}
                <a href="https://dashboard.stripe.com/connect/accounts" target="_blank" rel="noopener noreferrer">
                  Stripe Dashboard
                </a>
              </li>
              <li>Sign in with your Stripe Express account</li>
              <li>
                Click <strong>&quot;Balance&quot;</strong> in the sidebar
              </li>
              <li>
                You&apos;ll see available balance, pending balance, and payout schedule
              </li>
              <li>
                Click <strong>&quot;Payouts&quot;</strong> to see history of bank transfers
              </li>
            </ol>
          </HelpCard>
          <HelpCard>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#949cf7]" aria-hidden />
              Method 2: Email Notifications
            </h4>
            <p className="help-article__text text-sm mb-2">Stripe automatically sends email notifications for:</p>
            <HelpCheckList
              items={[
                "When a donation is received",
                "When a payout is initiated",
                "When money arrives in your bank",
                "If there are any issues with payouts",
              ]}
            />
          </HelpCard>
          <HelpCard>
            <h4 className="font-semibold mb-2">Method 3: Your Bank Account</h4>
            <p className="help-article__text text-sm mb-2">Check your bank statement for deposits from:</p>
            <HelpBulletList
              items={[
                <>
                  <strong>Descriptor:</strong> &quot;STRIPE&quot; or &quot;Stripe Payments&quot;
                </>,
                <>
                  <strong>Reference:</strong> May include your platform name
                </>,
                <>
                  <strong>Amount:</strong> Net amount after fees
                </>,
              ]}
            />
          </HelpCard>
        </div>

        <HelpCard className="mb-6">
          <HelpSubheading title="What You'll Actually Receive" icon={Wallet} />
          <p className="help-article__text text-sm mb-2">
            Example: Player donates <strong>$10.00 USD</strong>
          </p>
          <div className="listing-card p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Donation amount:</span>
              <span className="font-semibold">$10.00</span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee (5%):</span>
              <span className="font-semibold">-$0.50</span>
            </div>
            <div className="flex justify-between">
              <span>Stripe processing fee (~2.9% + $0.30):</span>
              <span className="font-semibold">-$0.59</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
              <span>You receive:</span>
              <span>$8.91</span>
            </div>
          </div>
          <p className="help-article__text text-xs mt-3">
            <strong>Note:</strong> Stripe fees vary by card type and country. International cards may have higher fees (~3.9% + $0.30).
          </p>
        </HelpCard>

        <HelpSubheading title="Payout Schedule Explained" icon={Calendar} />
        <div className="space-y-4 mb-6">
          <HelpCard>
            <h4 className="font-semibold mb-2">Daily Payouts (Standard)</h4>
            <p className="help-article__text text-sm mb-2">
              Our platform is configured for <strong>daily automatic payouts</strong>:
            </p>
            <HelpBulletList
              items={[
                "Stripe initiates payout once per day",
                "Includes all donations from previous day",
                "Takes 2-5 business days to reach bank",
                "No action needed — completely automatic",
              ]}
            />
            <p className="help-article__text text-xs mt-3">
              <strong>Example timeline:</strong> Monday: $20 in donations → Payout initiated Tuesday → Money in bank Thursday
            </p>
          </HelpCard>
          <HelpCard>
            <h4 className="font-semibold mb-2">Rolling Reserve (New Accounts)</h4>
            <p className="help-article__text text-sm mb-2">
              For the first 2-4 weeks, Stripe uses a <strong>rolling reserve</strong>:
            </p>
            <HelpBulletList
              items={[
                "Payouts delayed by 7-14 days initially",
                "Protects against fraud and chargebacks",
                "Automatically switches to daily schedule after building history",
                "Completely normal — happens to all new accounts",
              ]}
            />
          </HelpCard>
        </div>

        <HelpSubheading title="Minimum Payout Amounts" icon={Coins} />
        <p className="help-article__text text-sm mb-3">
          Stripe won&apos;t send a payout until your balance reaches a minimum threshold:
        </p>
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          {[
            ["Australia", "$1 AUD"],
            ["United States", "$1 USD"],
            ["UK", "£1 GBP"],
            ["EU", "€1 EUR"],
            ["Canada", "$1 CAD"],
            ["Other", "$1-25 USD equiv."],
          ].map(([region, amount]) => (
            <div key={region} className="listing-card p-3 text-sm">
              <strong>{region}:</strong> {amount}
            </div>
          ))}
        </div>

        <HelpCard className="mb-6">
          <HelpSubheading title="How to View Your Earnings" icon={Eye} />
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">In Stripe Dashboard:</h4>
              <ol className="list-decimal list-inside text-sm space-y-2 ml-2">
                <li>
                  Visit{" "}
                  <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                    dashboard.stripe.com
                  </a>
                </li>
                <li>Log in with your Stripe account</li>
                <li>
                  View <strong>Balance</strong> — available and pending funds
                </li>
                <li>
                  View <strong>Payouts</strong> — transfer history to bank
                </li>
                <li>
                  View <strong>Payments</strong> — individual donations received
                </li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Understanding Your Balance:</h4>
              <HelpBulletList
                items={[
                  <>
                    <strong>Available:</strong> Ready to be paid out (will go out on next payout)
                  </>,
                  <>
                    <strong>Pending:</strong> Being processed (will become available soon)
                  </>,
                  <>
                    <strong>In transit:</strong> On the way to your bank
                  </>,
                ]}
              />
            </div>
          </div>
        </HelpCard>

        <HelpCard className="mb-6">
          <HelpSubheading title="Instant Payouts (Optional)" icon={Zap} />
          <p className="help-article__text text-sm mb-2">
            Some countries support <strong>Instant Payouts</strong> for eligible accounts:
          </p>
          <HelpBulletList
            items={[
              <>
                <strong>Speed:</strong> Money in your bank within minutes
              </>,
              <>
                <strong>Cost:</strong> 0.5-1% fee per payout
              </>,
              <>
                <strong>Eligibility:</strong> Must have debit card linked (not all banks supported)
              </>,
              <>
                <strong>Availability:</strong> US, UK, EU, SG, AU (limited banks)
              </>,
            ]}
          />
          <p className="help-article__text text-xs mt-3">
            <strong>Note:</strong> Most users stick with free daily payouts. Instant is optional for urgent needs.
          </p>
        </HelpCard>

        <HelpCard>
          <HelpSubheading title="Tax Reporting" icon={FileText} />
          <HelpCallout>
            Donations you receive are considered income for tax purposes.
          </HelpCallout>
          <div className="space-y-2 text-sm mt-4">
            <p>
              <strong>What Stripe does:</strong>
            </p>
            <HelpBulletList
              items={[
                "Reports your earnings to tax authorities (IRS, ATO, HMRC, etc.)",
                "Sends you tax forms (1099-K in US, similar in other countries)",
                "Usually only if you earn over threshold (e.g., $600/year in US)",
              ]}
            />
            <p className="mt-3">
              <strong>What you should do:</strong>
            </p>
            <HelpBulletList
              items={[
                "Keep records of donations received",
                "Declare as income on tax return",
                "Consult a tax professional for specific advice",
                "Deduct server hosting costs (may be applicable)",
              ]}
            />
          </div>
        </HelpCard>
      </HelpSection>

      <HelpSection title="Troubleshooting" icon={Wrench}>
        <div className="space-y-3">
          <details>
            <summary className="font-semibold cursor-pointer">Account verification is taking too long</summary>
            <p className="text-sm mt-2">Stripe typically verifies within 24-48 hours. If it&apos;s longer, check:</p>
            <HelpBulletList
              items={[
                "Your email for verification requests",
                "Stripe dashboard for pending actions",
                "ID photo quality (upload clearer photo if needed)",
              ]}
            />
          </details>
          <details>
            <summary className="font-semibold cursor-pointer">Bank details rejected</summary>
            <p className="text-sm mt-2">Common issues:</p>
            <HelpBulletList
              items={[
                "Account number format incorrect",
                "Using savings account (use checking/current)",
                "Bank doesn't support electronic transfers",
              ]}
            />
          </details>
          <details>
            <summary className="font-semibold cursor-pointer">Need to change country</summary>
            <p className="text-sm mt-2">If you selected the wrong country, you need to reset:</p>
            <ol className="list-decimal list-inside text-sm mt-2 ml-2 space-y-1">
              <li>
                Go to <Link href="/dashboard/stripe/reset">/dashboard/stripe/reset</Link>
              </li>
              <li>Delete your current connection</li>
              <li>Update country in Settings</li>
              <li>Connect again with correct country</li>
            </ol>
          </details>
          <details>
            <summary className="font-semibold cursor-pointer">Set up incorrectly? Need to start over?</summary>
            <p className="text-sm mt-2">
              If you didn&apos;t follow the setup guide correctly or made mistakes during setup, you can remove your payout method and try again:
            </p>
            <ol className="list-decimal list-inside text-sm mt-2 ml-2 space-y-1">
              <li>
                Go to <Link href="/settings">Settings</Link>
              </li>
              <li>Scroll to the &quot;Payout Method&quot; section</li>
              <li>
                Click the <strong>&quot;Remove Payout Method&quot;</strong> button
              </li>
              <li>Confirm the removal</li>
              <li>
                Click <strong>&quot;Connect Stripe Account&quot;</strong> again
              </li>
              <li>Follow this guide carefully to set it up correctly</li>
            </ol>
            <p className="help-article__text text-xs mt-3">
              <strong>Tip:</strong> This is especially useful if you entered wrong information, selected the wrong country, or didn&apos;t complete the setup.
            </p>
          </details>
          <details>
            <summary className="font-semibold cursor-pointer">Still asking for business registration</summary>
            <p className="text-sm mt-2">This is normal for compliance. You can:</p>
            <HelpBulletList
              items={[
                <>
                  <strong>Leave it blank</strong> — most individuals don&apos;t have this
                </>,
                "Enter your personal name as the \"business name\"",
                "Select industry: \"Charitable\" or \"Membership\"",
              ]}
            />
          </details>
        </div>
      </HelpSection>

      <HelpSection title="Need Help?">
        <div className="grid md:grid-cols-2 gap-4">
          <HelpCard>
            <HelpSubheading title="Stripe Support" icon={Building2} />
            <p className="help-article__text text-sm mb-3">For account setup issues or verification questions:</p>
            <a href="https://support.stripe.com" target="_blank" rel="noopener noreferrer" className="text-sm">
              Visit Stripe Support →
            </a>
          </HelpCard>
          <HelpCard>
            <HelpSubheading title="Platform Support" icon={User} />
            <p className="help-article__text text-sm mb-3">For platform-specific issues:</p>
            <Link href="/settings" className="text-sm">
              Go to Settings →
            </Link>
          </HelpCard>
        </div>
      </HelpSection>

      <div className="help-cta">
        <h2 className="text-xl font-bold mb-2">Ready to Get Started?</h2>
        <p className="help-article__text mb-4">Connect your Stripe account and start receiving donations today.</p>
        <Link href="/settings" className="btn-primary inline-block px-6 py-3 text-sm">
          Go to Settings
        </Link>
      </div>
    </HelpArticleLayout>
  )
}
