import { Calendar, CreditCard, Wallet } from "lucide-react";
import TransactionHistory from "./tx-history";
import WorkspaceMembers from "./workspace-members";
import DashboardTasks from "./dashboard-tasks";
import { CreateTaskDrawer } from "@/components/create-task-drawer";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveAccount } from "thirdweb/react";

export default function Content() {
	const { activeWorkspace } = useWorkspace();
	const account = useActiveAccount();
	return (
		<div className="space-y-4 px-4 sm:px-0">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				<div className="bg-white dark:bg-[#0e0e10] rounded-xl p-4 sm:p-6 flex flex-col items-start justify-start border border-gray-200 dark:border-[#1F1F23] col-span-1 lg:col-span-2">
					<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full mb-4 gap-3 sm:gap-0">
						<h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-left flex items-center gap-2">
							<Calendar className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-900 dark:text-zinc-50" />
							<span className="text-sm sm:text-base">Catch up on recent tasks</span>
						</h2>
						{activeWorkspace?.owner === account?.address && <CreateTaskDrawer />}
					</div>
					<DashboardTasks />
				</div>

				<div className="bg-white dark:bg-[#0e0e10] rounded-xl p-4 sm:p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
					<h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 text-left flex items-center gap-2">
						<Wallet className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-900 dark:text-zinc-50" />
						<span className="text-sm sm:text-base">Workspace Members</span>
					</h2>
					<div className="flex-1">
						<WorkspaceMembers />
					</div>
				</div>

				<div className="bg-white dark:bg-[#0e0e10] rounded-xl p-4 sm:p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
					<h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 text-left flex items-center gap-2">
						<CreditCard className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-900 dark:text-zinc-50" />
						<span className="text-sm sm:text-base">Recent Transactions</span>
					</h2>
					<div className="flex-1">
						<TransactionHistory />
					</div>
				</div>
			</div>
		</div>
	);
}
