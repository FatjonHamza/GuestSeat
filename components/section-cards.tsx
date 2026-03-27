"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

interface SectionCardsProps {
  invitationsSent: number
  invitationsResponded: number
  totalGuests: number
  tablesCreated: number
}

export function SectionCards({
  invitationsSent,
  invitationsResponded,
  totalGuests,
  tablesCreated,
}: SectionCardsProps) {
  const responseRate =
    invitationsSent > 0
      ? Math.round((invitationsResponded / invitationsSent) * 100)
      : 0

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Invitations Sent</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {invitationsSent}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon
              />
              +{invitationsSent}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sent invitations{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Current event campaign
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Invitations Responded</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {invitationsResponded}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              {responseRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Response rate{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Based on sent invitations
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Guests</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalGuests}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon
              />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Confirmed guest count{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Across all guest groups</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tables Created</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {tablesCreated}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon
              />
              +{tablesCreated}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Seating layout progress{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Tables available for assignment</div>
        </CardFooter>
      </Card>
    </div>
  )
}
