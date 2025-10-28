import { Card } from "@/components/ui/card"
import { useUserTransactionHistory } from "@/hooks/use-fetch-user-contract-details"
import { cn } from "@/lib/utils"
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
} from "lucide-react"

type Transaction = {
  timestamp: bigint
  amount: number
  txType: string
}

export default function TransactionHistory() {
  const { transactions } = useUserTransactionHistory(0, 6);

  return (
    <Card
      className={cn(
        "w-full max-w-xl mx-auto h-full",
        "@container/card",
        "border border-zinc-100 dark:border-zinc-800",
        "rounded-xl shadow-sm backdrop-blur-xl"
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Recent Activity
          </h2>
          <span className="hidden sm:block text-xs text-zinc-600 dark:text-zinc-400">This Month</span>
        </div>

        <div className="space-y-1">
          {
            transactions && transactions.length > 0 ? (
              transactions.map((transaction, i) => (
                <TransactionItem key={i} transaction={transaction} />
              ))
            ) : (
              <div className="text-sm text-zinc-600 dark:text-zinc-400 flex justify-center items-center h-full w-full">No transactions found.</div>
            )
          }
        </div>
      </div>

      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
        <button
          type="button"
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "py-2 px-3 rounded-lg",
            "text-xs font-medium",
            "bg-gradient-to-r from-zinc-900 to-zinc-800",
            "dark:from-zinc-50 dark:to-zinc-200",
            "text-zinc-50 dark:text-zinc-900",
            "hover:from-zinc-800 hover:to-zinc-700",
            "dark:hover:from-zinc-200 dark:hover:to-zinc-300",
            "shadow-sm hover:shadow",
            "transform transition-all duration-200",
            "hover:-translate-y-0.5",
            "active:translate-y-0",
            "focus:outline-none focus:ring-2",
            "focus:ring-zinc-500 dark:focus:ring-zinc-400",
            "focus:ring-offset-2 dark:focus:ring-offset-zinc-900",
          )}
        >
          <span>View All Transactions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  )
}

function TransactionItem ({ transaction }: { transaction: Transaction }) {
  const txKind = transaction.txType === "Task creation" ? "outgoing" : "incoming";

  return (
    <div
      className={cn(
        "group flex items-center gap-3",
        "p-2 rounded-lg",
        "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
        "transition-all duration-200",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg",
          "bg-zinc-100 dark:bg-zinc-800",
          "border border-zinc-200 dark:border-zinc-700",
        )}
      >
        {
          txKind === "incoming" ? (
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowUpRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          )
        }
      </div>

      <div className="flex-1 flex items-center justify-between min-w-0">
        <div className="space-y-0.5">
          <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{transaction.txType}</h3>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{transaction.timestamp ? new Date(Number(transaction.timestamp) * 1000).toLocaleString() : "-"}</p>
        </div>

        <div className="flex items-center gap-1.5 pl-3">
          <span
            className={cn(
              "text-xs font-medium",
              txKind === "incoming"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {txKind === "incoming" ? "+" : "-"}
            {transaction.amount}
          </span>
          {txKind === "incoming" ? (
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowUpRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>
    </div>
  )
}
