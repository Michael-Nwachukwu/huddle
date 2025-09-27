import { useState, useEffect, useCallback, useRef } from 'react';

interface MessageChunkInfo {
    initial_transaction_id: string;
    nonce: number;
    number: number;
    total: number;
    scheduled: boolean;
}

interface TopicMessage {
    chunk_info: MessageChunkInfo;
    consensus_timestamp: string;
    message: string; // base64 encoded
    payer_account_id: string;
    running_hash: string;
    running_hash_version: number;
    sequence_number: number;
    topic_id: string;
}

interface MessagesResponse {
    messages: TopicMessage[];
    links: {
        next: string | null;
    };
}

interface CachedTopicData {
    messages: TopicMessage[];
    lastFetchTime: number;
    latestTimestamp: string | null;
    hasMore: boolean;
    nextUrl: string | null;
}

interface UseTopicMessagesOptions {
    limit?: number;
    order?: 'asc' | 'desc';
    encoding?: 'base64';
    refetchInterval?: number;
    cacheTimeout?: number;
}

interface UseTopicMessagesReturn {
    messages: TopicMessage[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    loadingMore: boolean;
    isFromCache: boolean;
}

const HEDERA_MIRROR_NODE_BASE_URL = 'https://testnet.mirrornode.hedera.com';

// In-memory cache
const messageCache = new Map<string, CachedTopicData>();

export function useTopicMessages(
    topicId: string | null | undefined,
    options: UseTopicMessagesOptions = {}
): UseTopicMessagesReturn {
    const {
        limit = 25,
        order = 'desc',
        encoding = 'base64',
        refetchInterval = 10000,
        cacheTimeout = 30000,
    } = options;

    const [messages, setMessages] = useState<TopicMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [isFromCache, setIsFromCache] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);
    const currentTopicRef = useRef<string | null>(null);

    // Stable cache key function
    const getCacheKey = useCallback((id: string) => {
        return `${id}-${limit}-${order}-${encoding}`;
    }, [limit, order, encoding]);

    // Stable cache validation function
    const isCacheValid = useCallback((cachedData: CachedTopicData) => {
        return Date.now() - cachedData.lastFetchTime < cacheTimeout;
    }, [cacheTimeout]);

    // Main fetch function - REMOVED messages dependency
    const fetchMessages = useCallback(async (url?: string, isLoadMore = false) => {
        if (!topicId || !mountedRef.current) return;

        console.log('Fetching messages for topic:', topicId, { url, isLoadMore });

        const cacheKey = getCacheKey(topicId);
        const cachedData = messageCache.get(cacheKey);

        // Check if we can use cached data for initial load
        if (!isLoadMore && !url && cachedData && isCacheValid(cachedData)) {
            console.log('Using cached messages for topic:', topicId);
            if (mountedRef.current) {
                setMessages(cachedData.messages);
                setHasMore(cachedData.hasMore);
                setNextUrl(cachedData.nextUrl);
                setIsFromCache(true);
                setLoading(false);
            }
            return;
        }

        const setLoadingState = isLoadMore ? setLoadingMore : setLoading;
        setLoadingState(true);
        setError(null);
        setIsFromCache(false);

        try {
            let fetchUrl: string;

            if (url) {
                fetchUrl = url;
            } else if (!isLoadMore && cachedData && cachedData.messages.length > 0 && cachedData.latestTimestamp) {
                // Smart refresh - only fetch newer messages
                console.log('Fetching new messages since:', cachedData.latestTimestamp);
                fetchUrl = `${HEDERA_MIRROR_NODE_BASE_URL}/api/v1/topics/${topicId}/messages?limit=${limit}&order=${order}&encoding=${encoding}&timestamp=gt:${cachedData.latestTimestamp}`;
            } else {
                // Initial load or full refresh
                fetchUrl = `${HEDERA_MIRROR_NODE_BASE_URL}/api/v1/topics/${topicId}/messages?limit=${limit}&order=${order}&encoding=${encoding}`;
            }

            console.log('Fetching from URL:', fetchUrl);

            const response = await fetch(fetchUrl);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Topic not found');
                } else if (response.status === 400) {
                    const errorData = await response.json();
                    throw new Error(errorData._status?.messages?.[0]?.message || 'Invalid request parameters');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: MessagesResponse = await response.json();

            if (!mountedRef.current || currentTopicRef.current !== topicId) return;

            let finalMessages: TopicMessage[] = [];

            if (isLoadMore) {
                // For load more, append to existing messages
                setMessages(prev => {
                    finalMessages = [...prev, ...data.messages];
                    return finalMessages;
                });
            } else if (!isLoadMore && cachedData && cachedData.messages.length > 0 && url === undefined) {
                // Smart refresh - merge new messages with cached ones
                const newMessages = data.messages.filter(newMsg =>
                    !cachedData.messages.some(cachedMsg =>
                        cachedMsg.consensus_timestamp === newMsg.consensus_timestamp &&
                        cachedMsg.sequence_number === newMsg.sequence_number
                    )
                );

                if (newMessages.length > 0) {
                    console.log(`Found ${newMessages.length} new messages`);
                    finalMessages = order === 'desc'
                        ? [...newMessages, ...cachedData.messages]
                        : [...cachedData.messages, ...newMessages];
                } else {
                    console.log('No new messages found');
                    finalMessages = cachedData.messages;
                }

                setMessages(finalMessages);
            } else {
                // Initial load or full refresh
                finalMessages = data.messages;
                setMessages(finalMessages);
            }

            setHasMore(!!data.links.next);
            setNextUrl(data.links.next);

            // Update cache
            const latestTimestamp = finalMessages.length > 0
                ? (order === 'desc' ? finalMessages[0].consensus_timestamp : finalMessages[finalMessages.length - 1].consensus_timestamp)
                : null;

            messageCache.set(cacheKey, {
                messages: finalMessages,
                lastFetchTime: Date.now(),
                latestTimestamp,
                hasMore: !!data.links.next,
                nextUrl: data.links.next,
            });

        } catch (err) {
            if (mountedRef.current && currentTopicRef.current === topicId) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
                setError(errorMessage);
                console.error('Error fetching topic messages:', err);
            }
        } finally {
            if (mountedRef.current && currentTopicRef.current === topicId) {
                setLoadingState(false);
            }
        }
    }, [topicId, limit, order, encoding, getCacheKey, isCacheValid]); // REMOVED messages dependency

    const loadMore = useCallback(async () => {
        if (!nextUrl || loadingMore || !hasMore) return;
        await fetchMessages(nextUrl, true);
    }, [nextUrl, loadingMore, hasMore, fetchMessages]);

    const refetch = useCallback(async () => {
        if (!topicId) return;
        // Clear cache for this topic to force fresh fetch
        const cacheKey = getCacheKey(topicId);
        messageCache.delete(cacheKey);
        await fetchMessages();
    }, [topicId, fetchMessages, getCacheKey]);

    // SINGLE useEffect for topic changes and intervals
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Reset states when topicId changes or becomes null
        if (!topicId) {
            currentTopicRef.current = null;
            setMessages([]);
            setError(null);
            setLoading(false);
            setIsFromCache(false);
            setHasMore(false);
            setNextUrl(null);
            return;
        }

        // Update current topic ref
        currentTopicRef.current = topicId;

        // Initial fetch
        fetchMessages();

        // Setup interval for periodic refresh
        intervalRef.current = setInterval(() => {
            if (mountedRef.current && currentTopicRef.current === topicId) {
                console.log('Interval refresh for topic:', topicId);
                fetchMessages();
            }
        }, refetchInterval);

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [topicId, fetchMessages, refetchInterval]);

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;

        return () => {
            console.log('Component unmounting, cleaning up...');
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    return {
        messages,
        loading,
        error,
        refetch,
        hasMore,
        loadMore,
        loadingMore,
        isFromCache,
    };
}

// Utility function to decode base64 messages
export function decodeMessage(base64Message: string): string {
    try {
        return atob(base64Message);
    } catch (error) {
        console.error('Error decoding message:', error);
        return base64Message;
    }
}

// Utility to clear cache for specific topic or all topics
export function clearMessageCache(topicId?: string) {
    if (topicId) {
        for (const [key] of messageCache) {
            if (key.startsWith(topicId)) {
                messageCache.delete(key);
            }
        }
    } else {
        messageCache.clear();
    }
}