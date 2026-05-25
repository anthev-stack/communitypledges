import { ReactNode } from "react"
import MarketingListingLayout from "./MarketingListingLayout"

export default function MarketingDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <MarketingListingLayout
      title="Dashboard"
      subtitle="Manage your servers, communities, pledges, and account settings."
    >
      {children}
    </MarketingListingLayout>
  )
}
