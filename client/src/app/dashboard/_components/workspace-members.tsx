import Address from "@/components/Address";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction } from "@/components/ui/card";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import InviteMembers from "./invite-members";
import { cn } from "@/lib/utils";
import { useActiveAccount } from "thirdweb/react";

export default function WorkspaceMembers() {
	const { teamMembers, activeWorkspace } = useWorkspace();
	const account = useActiveAccount();

	return (
		<Card className={cn("w-full max-w-xl mx-auto h-full", "@container/card", "border border-zinc-100 dark:border-zinc-800", "rounded-xl shadow-sm backdrop-blur-xl")}>
			<div className="max-w-2xl p-4">
				<div className="flex justify-between items-center">
					{/* <div> */}
					<h1 className="text-2xl font-semibold mb-4">Team Members</h1>
					{
						activeWorkspace?.owner === account?.address && <InviteMembers />
					}
				</div>
				<p className="text-gray-400 text-md mb-12 font-light">Invite your team members to collaborate.</p>
				{/* </div> */}

				<div className="space-y-8">
					{teamMembers?.map((member, index) => (
						<div
							key={index}
							className="flex items-center justify-between">
							<Address address={member.user} />

							<CardAction>
								<Badge
									variant="outline"
									className="w-28 h-8 rounded-2xl">
									{member.role}
								</Badge>
							</CardAction>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
}
