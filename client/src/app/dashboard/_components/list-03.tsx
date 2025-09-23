import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Calendar,
  type LucideIcon,
  ArrowRight,
  CheckCircle2,
  Timer,
  AlertCircle,
  ChevronUp,
  ChevronsUp,
} from "lucide-react"
import React from "react"

// TypeScript interface from ABI
interface Task {
  id: number;
  workspaceId: number;
  isRewarded: boolean;
  isPaymentNative: boolean;
  taskState: 'active' | 'completed' | 'archived' | 'inProgress' | 'assigneeDone';
  reward: number;
  grossReward: number;
  token: string;
  title: string;
  description: string;
  startTime: number;
  dueDate: number;
  topicId: string;
  fileId: string;
}

// Dummy tasks array
const dummyTasks: (Task & { priority: 'high' | 'medium' | 'low' })[] = [
  {
    id: 1,
    workspaceId: 1,
    isRewarded: true,
    isPaymentNative: true,
    taskState: 'active',
    reward: 100,
    grossReward: 120,
    token: '0x0000000000000000000000000000000000000000',
    title: 'Planning Meeting',
    description: 'Organize team planning session for Q4 objectives and strategies',
    startTime: 1758326400,
    dueDate: 1758758400, // Sep 25, 2025
    topicId: 'topic1',
    fileId: 'file1',
    priority: 'high',
  },
  {
    id: 2,
    workspaceId: 1,
    isRewarded: true,
    isPaymentNative: false,
    taskState: 'inProgress',
    reward: 200,
    grossReward: 240,
    token: '0xabc...',
    title: 'Develop Feature A',
    description: 'Implement new user authentication system with OAuth integration',
    startTime: 1758499200,
    dueDate: 1759190400, // Sep 30, 2025
    topicId: 'topic2',
    fileId: 'file2',
    priority: 'medium',
  },
  {
    id: 3,
    workspaceId: 1,
    isRewarded: true,
    isPaymentNative: true,
    taskState: 'completed',
    reward: 150,
    grossReward: 180,
    token: '0x000...',
    title: 'Bug Fix Report',
    description: 'Document and fix reported bugs from last sprint',
    startTime: 1757462400,
    dueDate: 1757894400, // Sep 15, 2025
    topicId: 'topic3',
    fileId: 'file3',
    priority: 'low',
  },
  {
    id: 4,
    workspaceId: 1,
    isRewarded: true,
    isPaymentNative: false,
    taskState: 'assigneeDone',
    reward: 300,
    grossReward: 360,
    token: '0xdef...',
    title: 'UI Redesign',
    description: 'Update user interface for better user experience',
    startTime: 1757894400,
    dueDate: 1758326400, // Sep 20, 2025
    topicId: 'topic4',
    fileId: 'file4',
    priority: 'high',
  },
  {
    id: 5,
    workspaceId: 1,
    isRewarded: true,
    isPaymentNative: true,
    taskState: 'archived',
    reward: 50,
    grossReward: 60,
    token: '0x000...',
    title: 'Research Task',
    description: 'Research new technologies for upcoming projects',
    startTime: 1756684800,
    dueDate: 1757462400, // Sep 10, 2025
    topicId: 'topic5',
    fileId: 'file5',
    priority: 'medium',
  },
  {
    id: 6,
    workspaceId: 1,
    isRewarded: true,
    isPaymentNative: false,
    taskState: 'active',
    reward: 250,
    grossReward: 300,
    token: '0xghi...',
    title: 'Marketing Campaign',
    description: 'Plan and execute marketing campaign for product launch',
    startTime: 1758758400,
    dueDate: 1759622400, // Oct 5, 2025
    topicId: 'topic6',
    fileId: 'file6',
    priority: 'high',
  },
  {
    id: 7,
    workspaceId: 1,
    isRewarded: true,
    isPaymentNative: true,
    taskState: 'inProgress',
    reward: 400,
    grossReward: 480,
    token: '0x000...',
    title: 'Code Review',
    description: 'Review code submissions from team members',
    startTime: 1759190400,
    dueDate: 1760054400, // Oct 10, 2025
    topicId: 'topic7',
    fileId: 'file7',
    priority: 'medium',
  },
  {
    id: 8,
    workspaceId: 1,
    isRewarded: true,
    isPaymentNative: false,
    taskState: 'completed',
    reward: 180,
    grossReward: 216,
    token: '0xjkl...',
    title: 'Documentation Update',
    description: 'Update project documentation with latest changes',
    startTime: 1758326400,
    dueDate: 1758499200, // Sep 22, 2025
    topicId: 'topic8',
    fileId: 'file8',
    priority: 'low',
  },
];

// Map dummy tasks to ListItem
const ITEMS: ListItem[] = dummyTasks.map((task) => {
  let status: ListItem['status'];
  if (task.taskState === 'active') {
    status = 'pending';
  } else if (task.taskState === 'inProgress') {
    status = 'in-progress';
  } else {
    status = 'completed'; // completed, assigneeDone, archived
  }

  let progress = 0;
  if (status === 'in-progress') {
    progress = 50;
  } else if (status === 'completed') {
    progress = 100;
  }

  const date = `Due: ${new Date(task.dueDate * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const icon: LucideIcon = task.priority === 'high' ? ChevronUp : task.priority === 'medium' ? ChevronUp : ChevronsUp;

  const iconStyle = task.priority;

  return {
    id: task.id.toString(),
    title: task.title,
    subtitle: task.description,
    icon,
    iconStyle,
    date,
    amount: `$${task.reward}`,
    status,
    progress,
  };
});

interface ListItem {
  id: string
  title: string
  subtitle: string
  icon: LucideIcon
  iconStyle: string
  date: string
  time?: string
  amount?: string
  status: "pending" | "in-progress" | "completed"
  progress?: number
}

interface List03Props {
  items?: ListItem[]
  className?: string
}

const iconStyles = {
  high: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100",
  medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100",
  low: "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100",
}

const statusConfig = {
  pending: {
    icon: Timer,
    class: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  "in-progress": {
    icon: AlertCircle,
    class: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  completed: {
    icon: CheckCircle2,
    class: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
}

export default function List03({ items = ITEMS, className }: List03Props) {
  return (
    <div className={cn("w-full overflow-x-auto scrollbar-none", className)}>
      <div className="flex gap-3 min-w-full p-1">
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "flex flex-col",
              "w-[280px] shrink-0",
              "@container/card",
              "rounded-xl",
              "border border-zinc-100 dark:border-zinc-800",
              "hover:border-zinc-200 dark:hover:border-zinc-700",
              "transition-all duration-200",
              "shadow-sm backdrop-blur-xl",
              "p-0"
            )}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-lg", iconStyles[item.iconStyle as keyof typeof iconStyles])}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                    statusConfig[item.status].bg,
                    statusConfig[item.status].class,
                  )}
                >
                  {React.createElement(statusConfig[item.status].icon, { className: "w-3.5 h-3.5" })}
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{item.subtitle}</p>
              </div>

              {typeof item.progress === "number" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">Progress</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{item.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {item.amount && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.amount}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">reward</span>
                </div>
              )}

              <div className="flex items-center text-xs text-zinc-600 dark:text-zinc-400">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                <span>{item.date}</span>
              </div>
            </div>

            <div className="mt-auto border-t border-zinc-100 dark:border-zinc-800">
              <button
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  "py-2.5 px-3",
                  "text-xs font-medium",
                  "text-zinc-600 dark:text-zinc-400",
                  "hover:text-zinc-900 dark:hover:text-zinc-100",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                  "transition-colors duration-200",
                )}
              >
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}