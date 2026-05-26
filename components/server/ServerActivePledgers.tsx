"use client"

import OverlappingAvatarStack from "@/components/pledge/OverlappingAvatarStack"
import { Price } from "@/components/Price"

type PledgeUser = {
  id: string
  amount: number
  updatedAt: string
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

type Props = {
  pledges: PledgeUser[]
}

export default function ServerActivePledgers({ pledges }: Props) {
  if (pledges.length === 0) {
    return <p className="text-gray-500 text-center py-6">No pledges yet. Be the first!</p>
  }

  const items = pledges.map((pledge) => ({
    id: pledge.id,
    name: pledge.user.name,
    image: pledge.user.image,
    badge: (
      <>
        <Price amountUSD={pledge.amount} showCode={false} />
        <span className="overlapping-avatar-stack__badge-suffix">/mo</span>
      </>
    ),
    tooltip: `Pledged ${new Date(pledge.updatedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`,
  }))

  return (
    <OverlappingAvatarStack
      items={items}
      size="lg"
      maxDisplay={16}
      className="server-detail-active-pledgers__stack"
      ariaLabel={`${pledges.length} active pledgers`}
    />
  )
}
