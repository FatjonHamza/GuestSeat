"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon } from "lucide-react"

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

  const cards = [
    {
      key: "sent",
      title: "Ftesa të dërguara",
      value: invitationsSent,
      badge: `+${invitationsSent}`,
      description: "Fushata aktuale e ngjarjes",
    },
    {
      key: "responded",
      title: "Ftesa të përgjigjura",
      value: invitationsResponded,
      badge: `${responseRate}%`,
      description: "Bazuar në ftesat e dërguara",
    },
    {
      key: "guests",
      title: "Totali i të ftuarve",
      value: totalGuests,
      badge: "Aktive",
      description: "Në të gjitha grupet e të ftuarve",
    },
    {
      key: "tables",
      title: "Tavolina të krijuara",
      value: tablesCreated,
      badge: `+${tablesCreated}`,
      description: "Tavolina të gatshme për caktim",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}>
          <CardHeader className="pb-2">
            <CardDescription>{card.title}</CardDescription>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {card.value}
              </CardTitle>
              <Badge variant="secondary" className="gap-1">
                <TrendingUpIcon className="size-3.5" />
                {card.badge}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
