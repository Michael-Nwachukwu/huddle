"use client";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import React from "react";


const content = [
    {
        title: "Create Your Workspace",
        description:
            "Start by setting up a new decentralized workspace. Each workspace is secured on Hedera and represented by a unique NFT, giving you verifiable ownership and permanent access control.",
        content: (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,var(--cyan-500),var(--emerald-500))] text-white">
                Create Workspace
            </div>
        ),
    },
    {
        title: "Invite & Join",
        description:
            "Invite teammates to join your workspace. Members mint an NFT pass behind the scenes, proving authentic membership and granting on-chain access to tasks, chats, and governance tools.",
        content: (
            <div className="flex h-full w-full items-center justify-center text-white">
                <img
                    src="/invite.webp"
                    width={300}
                    height={300}
                    className="h-full w-full object-cover"
                    alt="workspace invitation demo"
                />
            </div>
        ),
    },
    {
        title: "Create Tasks & Rewards",
        description:
            "Assign tasks with or without crypto rewards. Attach files securely with Hedera File Service, and let smart-contract escrow handle payouts once work is approved—transparent and trustless.",
        content: (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,var(--orange-500),var(--yellow-500))] text-white">
                Tasks & Rewards
            </div>
        ),
    },
    {
        title: "Collaborate in Real Time",
        description:
            "Chat in workspace-specific channels or comment directly under tasks. All messages are recorded on Hedera Consensus Service, ensuring private, tamper-proof communication for your team.",
        content: (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,var(--emerald-500),var(--teal-500))] text-white">
                Team Chat
            </div>
        ),
    },
    {
        title: "Propose & Vote",
        description:
            "Launch proposals and vote on key decisions within your workspace DAO. Every vote is securely recorded on-chain, making team governance fully transparent and member-driven.",
        content: (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,var(--purple-500),var(--pink-500))] text-white">
                Workspace DAO
            </div>
        ),
    },
    {
        title: "Plan with Huddle AI",
        description:
            "Let Huddle AI help you organize tasks, suggest workflows, and keep projects on track. Your AI teammate simplifies planning so you can focus on building.",
        content: (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,var(--blue-500),var(--indigo-500))] text-white">
                Huddle AI
            </div>
        ),
    },
];

export function Steps() {
    return (
        <div className="w-full py4">
            
            <StickyScroll content={content} />
        </div>
    );
}
