import { Calendar, CreditCard, Wallet } from "lucide-react"
import TransactionHistory from "./tx-history"
import WorkspaceMembers from "./workspace-members"
import DashboardTasks from "./dashboard-tasks"
import { CreateTaskDrawer } from "@/components/create-task-drawer"

export default function Content() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white dark:bg-[#0e0e10] rounded-xl p-6 flex flex-col items-start justify-start border border-gray-200 dark:border-[#1F1F23] col-span-2">
          <div className="flex justify-between items-center w-full mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white text-left flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
              Catch up on recent tasks
            </h2>
            <CreateTaskDrawer />
          </div>
          <DashboardTasks />
        </div>

        <div className="bg-white dark:bg-[#0e0e10] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2 ">
            <Wallet className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
            Workspace Members
          </h2>
          <div className="flex-1">
            <WorkspaceMembers />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0e0e10] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
            Recent Transactions
          </h2>
          <div className="flex-1">
            <TransactionHistory />
          </div>
        </div>
      </div>


    </div>
  )
}
