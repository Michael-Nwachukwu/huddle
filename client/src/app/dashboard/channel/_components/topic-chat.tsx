"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, RefreshCw, AlertCircle } from "lucide-react";
import { useTopicMessages, decodeMessage } from '@/hooks/useTopicMessages';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useActiveAccount } from 'thirdweb/react';
import { useMessageAccounts } from '@/hooks/use-bulk-account-fetcher';
import { useHederaAccount } from '@/hooks/use-hedera-account';
import Address from '@/components/Address';

interface TopicChatProps {
    topicId: string | null | undefined;
    className?: string;
}

export function TopicChat({ topicId, className }: TopicChatProps) {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const account = useActiveAccount();

    const { data } = useHederaAccount(account?.address || '');

    const userAccountId = data?.account || '';

    const {
        messages,
        loading,
        error,
        refetch,
        hasMore,
        loadMore,
        loadingMore
    } = useTopicMessages(topicId, {
        limit: 50,
        order: 'desc',
        refetchInterval: 3000,
    });

    // Use the bulk account fetcher
    const {
        loading: accountsLoading,
        error: accountsError,
    } = useMessageAccounts(messages, {
        enabled: messages.length > 0
    });

    // Memoize the reversed messages to prevent unnecessary re-renders
    const displayMessages = useMemo(() => {
        return [...messages].reverse();
    }, [messages]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Focus input when topicId changes
    useEffect(() => {
        if (topicId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [topicId]);

    const submitMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim() || !topicId) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/submit-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topicId: topicId,
                    message: userAccountId.trim() + ': ' + message.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit message');
            }

            setMessage('');

            // Refetch messages after a short delay
            setTimeout(() => {
                refetch();
            }, 2000);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit message';
            toast.error(errorMessage, {
                position: 'top-right',
            });
            console.error('Error submitting message:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const [seconds] = timestamp.split('.');
        const date = new Date(parseInt(seconds) * 1000);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatAccountId = (accountId: string) => {
        return accountId.slice(-6);
    };

    if (!topicId) {
        return (
            <div className={cn("flex items-center justify-center h-96 text-gray-500", className)}>
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No topic selected</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800">
                <div>
                    <h3 className="font-semibold">Topic: {topicId}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {messages.length} message{messages.length !== 1 ? 's' : ''}
                        {accountsLoading && messages.length > 0 && (
                            <span className="ml-2 text-xs">(Loading account info...)</span>
                        )}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {error && (
                    <div className="text-center text-red-500 p-4">
                        <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                        <p>{error}</p>
                        <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
                            Try Again
                        </Button>
                    </div>
                )}

                {accountsError && (
                    <div className="text-center text-orange-500 p-2 text-sm">
                        <p>Warning: Could not load all account information</p>
                    </div>
                )}

                {loading && messages.length === 0 ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-16 w-full max-w-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {hasMore && (
                            <div className="text-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="text-xs"
                                >
                                    {loadingMore ? 'Loading...' : 'Load older messages'}
                                </Button>
                            </div>
                        )}

                        {displayMessages.map((msg) => {
                            const decoded = decodeMessage(msg.message);
                            const [rawDisplayName, rawMessage] = decoded.split(/:(.+)/); // splits only on first colon
                            const displayName = rawDisplayName?.trim() || msg.payer_account_id;
                            const messageContent = rawMessage?.trim() || decoded;
                            const isCurrentUser = userAccountId == displayName;

                            return (
                                <div
                                    key={`${msg.consensus_timestamp}-${msg.sequence_number}`}
                                    className={isCurrentUser ? "flex gap-3 justify-end items-end" : "flex gap-3"}
                                >
                                    {/* Avatar - only show for others' messages when right-aligned */}
                                    {!isCurrentUser && (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                            {formatAccountId(msg.payer_account_id).slice(0, 2).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Message Content */}
                                    <div className="flex-1 min-w-0 max-w-md">
                                        <div className={cn(
                                            "flex items-center gap-2 mb-1",
                                            isCurrentUser ? "justify-end" : "justify-start"
                                        )}>
                                            {/* <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {displayName}
                                            </span> */}
                                            <Address hideIcon={true} accountId={displayName} hideAccountId={true} />
                                            <span className="text-xs text-gray-500">
                                                {formatTimestamp(msg.consensus_timestamp)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                #{msg.sequence_number}
                                            </span>
                                        </div>

                                        <Card className={cn(
                                            "p-3 shadow-sm",
                                            isCurrentUser
                                                ? "bg-blue-500 text-white ml-auto"
                                                : "bg-white dark:bg-neutral-800"
                                        )}>
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {messageContent}
                                            </p>
                                        </Card>

                                    </div>

                                    {/* Avatar for current user messages */}
                                    {isCurrentUser && (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                                            You
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white dark:bg-neutral-800 rounded-2xl mt-auto">
                <form onSubmit={submitMessage} className="flex gap-2 items-center">
                    <Input
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isSubmitting || !topicId}
                        className="flex-1 h-12 rounded-3xl"
                        maxLength={1024}
                    />
                    <Button
                        type="submit"
                        disabled={isSubmitting || !message.trim() || !topicId}
                        className="flex items-center gap-2 h-12 rounded-3xl"
                    >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? 'Sending...' : 'Send'}
                    </Button>
                </form>

                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>{message.length}/1024 characters</span>
                    <span>Messages are stored on Hedera Consensus Service</span>
                </div>
            </div>
        </div>
    );
}