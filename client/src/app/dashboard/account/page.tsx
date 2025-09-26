"use client"
import Address from '@/components/Address'
import React from 'react'
import { AccountAddress, AccountProvider, useActiveAccount, useReadContract, useWalletBalance } from 'thirdweb/react'
import { client } from '../../../../client';
import { shortenAddress } from "thirdweb/utils";
import { Button } from '@/components/ui/button';
import { hederaTestnet } from '@/utils/chains';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { ChartContainer, ChartTooltipContent, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis } from 'recharts';
import { PencilLineIcon } from 'lucide-react';
import { SetUsernameDialog } from '@/components/set-username-dialog';
import { contract as taskreaderContract } from '@/lib/huddle-taskReader-contract';
import { contract } from '@/lib/contract';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface StatsCardType {
    title: string;
    value: string;
}

const Page = () => {
    const account = useActiveAccount();
    const [isOpen, setIsOpen] = React.useState(false);
    const {userWorkspaces, teamMembers} = useWorkspace();

    const { data } = useWalletBalance({
        chain: hederaTestnet,
        address: account?.address,
        client: client,
    });

    const { data: userRecords } = useReadContract({
        contract : contract,
        method: "function userRecords(address) view returns ((uint16 totalTasksCounter, uint16 completedTaskCounter, uint16 inProgressTaskCounter, uint16 overdueTaskCounter, uint16 pendingTaskCounter, uint8 proposalCreatedCounter, uint8 proposalVotedCounter, uint256 ercRewardAmountSum, uint256 nativeRewardAmountSum)[])",
        params: [account?.address || "0x0"],
    });

    console.log("raw user stats", userRecords);

    const {
        data: username,
        isLoading: isLoadingUsername,
        // error: usernameError,
    } = useReadContract({
        contract : taskreaderContract,
        method:
            "function usernames(address) view returns (string)",
        params: [account?.address || "0x0"],
        queryOptions: {
            enabled: !!account?.address,
        },
    });

    console.log("username", username);

    interface UserStats {
        totalTasksCounter: number;
        completedTaskCounter: number;
        inProgressTaskCounter: number;
        overdueTaskCounter: number;
        pendingTaskCounter: number;
        proposalCreatedCounter: number;
        proposalVotedCounter: number;
        ercRewardAmountSum: number;
        nativeRewardAmountSum: number;
    }

    const userStats: UserStats = {
        totalTasksCounter: userRecords?.[0]?.totalTasksCounter || 0,
        completedTaskCounter: userRecords?.[0]?.completedTaskCounter || 0,
        inProgressTaskCounter: userRecords?.[0]?.inProgressTaskCounter || 0,
        overdueTaskCounter: userRecords?.[0]?.overdueTaskCounter || 0,
        pendingTaskCounter: userRecords?.[0]?.pendingTaskCounter || 0,
        proposalCreatedCounter: userRecords?.[0]?.proposalCreatedCounter || 0,
        proposalVotedCounter: userRecords?.[0]?.proposalVotedCounter || 0,
        ercRewardAmountSum: Number(userRecords?.[0]?.ercRewardAmountSum || 0),
        nativeRewardAmountSum: Number(userRecords?.[0]?.nativeRewardAmountSum || 0),
    };

    console.log("formatted user stats", userStats);


    const statsCard: StatsCardType[] = [
        {
            title: "Total Tasks",
            value: userStats.totalTasksCounter.toString()
        },
        {
            title: "Pending Tasks",
            value: userStats.pendingTaskCounter.toString()
        },
        {
            title: "In Progress Tasks",
            value: userStats.inProgressTaskCounter.toString()
        },
        {
            title: "Completed Tasks",
            value: userStats.completedTaskCounter.toString()
        },
        {
            title: "Proposals Created",
            value: userStats.proposalCreatedCounter.toString()
        },
        {
            title: "Proposals Voted",
            value: userStats.proposalVotedCounter.toString()
        },
        {
            title: "Usdt Earned",
            value: userStats.proposalVotedCounter.toString()
        },
        {
            title: "HBAR Earned",
            value: userStats.proposalVotedCounter.toString()
        },
    ]

    const chartData = [
        { month: "January", desktop: 186 },
        { month: "February", desktop: 305 },
        { month: "March", desktop: 237 },
        { month: "April", desktop: 73 },
        { month: "May", desktop: 209 },
        { month: "June", desktop: 214 },
    ]
    const chartConfig = {
        desktop: {
            label: "Desktop",
            color: "var(--chart-1)",
        },
    } satisfies ChartConfig

    return (
        <>
            <section className='mx-auto container max-w-5xl pt-14'>
                <div className="w-full space-y-8">
                    <div className="flex justify-between items-center">

                        {
                            !account && (
                                <h2 className='text-4xl'>Connect a wallet!</h2>
                            )
                        }

                        {
                            isLoadingUsername && <Skeleton className="h-16 w-56 rounded-2xl" />
                        }

                        {
                            !isLoadingUsername && account && username && (
                                <h2 className='text-4xl'>Hello, {username}!</h2>
                            )
                        }

                        {
                            !isLoadingUsername && account && !username && (
                                <h2 className='text-4xl flex gap-2 items-center'>
                                    <span className="pb-1">Set up username</span>
                                    <Button size={"icon"} variant={"outline"} onClick={() => setIsOpen(true)}>
                                        <PencilLineIcon />
                                    </Button>
                                </h2>
                            )
                        }

                        {
                            account ? (
                                <Address address={account?.address || ""} />
                            ) : (
                                <ConnectWalletButton />
                            )
                        }
                    </div>
                    <div className="grid grid-cols-3 py-4 gap-8 items-center">
                        <div className="col-span-2">
                            <ChartContainer config={chartConfig} className='h-40 w-full'>
                                <LineChart
                                    accessibilityLayer
                                    data={chartData}
                                    margin={{
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => value.slice(0, 3)}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Line
                                        dataKey="desktop"
                                        type="natural"
                                        stroke="#6b840a"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                        <ul className='space-y-3 text-stone-500 max-w-96 text-sm'>
                            <li className='flex justify-between items-center'>
                                <h3>Evm Address</h3>
                                {account ? (
                                    <AccountProvider
                                        address={account?.address || ""}
                                        client={client}
                                    >
                                        <AccountAddress formatFn={shortenAddress} />
                                    </AccountProvider>
                                ) : (
                                    <span>Connect a wallet first</span>
                                )}
                            </li>
                            <li className='flex justify-between items-center'>
                                <h3>Balance</h3>
                                {
                                    account ? data?.displayValue + " HBAR" : "Connect a wallet first"
                                }
                            </li>
                            <li className='flex justify-between items-center'>
                                <h3>Role</h3>
                                {
                                   account? teamMembers?.find((member) => member.user === account?.address)?.role : "Connect a wallet first"
                                }
                            </li>
                            <li className="flex justify-between items-center">
                                <span>userRecords</span>
                                <div className="flex gap-2 flex-wrap">
                                    {
                                        account ? userWorkspaces.map((workspace, index) => (
                                            <Badge key={index} variant="secondary" className="text-[#6b840a] dark:text-[#caef35]">
                                                {workspace.name}
                                            </Badge>
                                        )) : "Connect a wallet first"
                                    }
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-4 gap-4 my-4">
                        {statsCard.map((card, index) => (
                            <MetricCard key={index} {...card} />
                        ))}
                    </div>
                </div>
            </section>
            <SetUsernameDialog isOpen={isOpen} setIsOpen={setIsOpen} oldUsername={username} />
        </>
    )
}

export default Page


function MetricCard({ title, value }: StatsCardType) {
    return (
        <Card className="@container/card" data-slot="card">
            <CardHeader>
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
            </CardHeader>
        </Card>
    );
}