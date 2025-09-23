import Address from "@/components/Address"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AccountItem {
  id: string
  title: string
  description?: string
  balance: string
  type: "savings" | "checking" | "investment" | "debt"
}

const teamMembers = [
  {
    user: "0x1234567890123456789012345678901234567890",
    role: "Owner",
  },
  {
    user: "0x1234567890123456789012345678901234567890",
    role: "Developer",
  },
  {
    user: "0x1234567890123456789012345678901234567890",
    role: "Billing",
  },
]

interface List01Props {
  totalBalance?: string
  accounts?: AccountItem[]
  className?: string
}
export default function List01({ className }: List01Props) {
  return (
    <Card className={cn(
      "w-full max-w-xl mx-auto",
      "@container/card",
      "border border-zinc-100 dark:border-zinc-800",
      "rounded-xl shadow-sm backdrop-blur-xl",
      className,
    )}>
      <div className="max-w-2xl p-4">
        <h1 className="text-2xl font-semibold text-white mb-4">Team Members</h1>
        <p className="text-gray-400 text-md mb-12 font-light">Invite your team members to collaborate.</p>

        <div className="space-y-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="flex items-center justify-between">
              <Address address={member.user} />

              <CardAction>
                <Badge variant="outline" className="w-12 ">
                  {member.role}
                </Badge>
              </CardAction>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
