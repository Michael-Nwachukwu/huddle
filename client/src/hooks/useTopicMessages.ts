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
    cacheTimeout?: number; // How long cache is valid in ms
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

// In-memory cache - you could also use localStorage or a proper cache library
const messageCache = new Map<string, CachedTopicData>();

export function useTopicMessages(
    topicId: string | null | undefined,
    options: UseTopicMessagesOptions = {}
): UseTopicMessagesReturn {
    const {
        limit = 25,
        order = 'desc',
        encoding = 'base64',
        refetchInterval = 10000, // Increased to 10 seconds since we have smart caching
        cacheTimeout = 30000, // 30 seconds cache timeout
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

    // Stable cache key function
    const getCacheKey = useCallback((id: string) => {
        return `${id}-${limit}-${order}-${encoding}`;
    }, [limit, order, encoding]);

    // Stable cache validation function
    const isCacheValid = useCallback((cachedData: CachedTopicData) => {
        return Date.now() - cachedData.lastFetchTime < cacheTimeout;
    }, [cacheTimeout]);

    // Stable cache update function
    const updateCache = useCallback((id: string, data: Partial<CachedTopicData>) => {
        const cacheKey = getCacheKey(id);
        const existing = messageCache.get(cacheKey) || {
            messages: [],
            lastFetchTime: 0,
            latestTimestamp: null,
            hasMore: false,
            nextUrl: null,
        };

        messageCache.set(cacheKey, {
            ...existing,
            ...data,
            lastFetchTime: Date.now(),
        });
    }, [getCacheKey]);

    // Stable fetch new messages function
    const fetchNewMessages = useCallback(async (id: string, since?: string) => {
        let fetchUrl = `${HEDERA_MIRROR_NODE_BASE_URL}/api/v1/topics/${id}/messages?limit=${limit}&order=${order}&encoding=${encoding}`;

        if (since && order === 'desc') {
            fetchUrl += `&timestamp=gt:${since}`;
        } else if (since && order === 'asc') {
            fetchUrl += `&timestamp=gt:${since}`;
        }

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

        return await response.json();
    }, [limit, order, encoding]);

    // Main fetch function
    const fetchMessages = useCallback(async (url?: string, isLoadMore = false) => {
        if (!topicId) return;

        const cacheKey = getCacheKey(topicId);
        const cachedData = messageCache.get(cacheKey);

        // Check if we can use cached data for initial load
        if (!isLoadMore && !url && cachedData && isCacheValid(cachedData)) {
            console.log('Using cached messages for topic:', topicId);
            setMessages(cachedData.messages);
            setHasMore(cachedData.hasMore);
            setNextUrl(cachedData.nextUrl);
            setIsFromCache(true);
            setLoading(false);
            return;
        }

        const setLoadingState = isLoadMore ? setLoadingMore : setLoading;
        setLoadingState(true);
        setError(null);
        setIsFromCache(false);

        try {
            let data: MessagesResponse;

            if (url) {
                // Load more - use provided URL
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                data = await response.json();
            } else if (!isLoadMore && cachedData && cachedData.messages.length > 0) {
                // Smart refresh - only fetch newer messages
                console.log('Fetching new messages since:', cachedData.latestTimestamp);
                data = await fetchNewMessages(topicId, cachedData.latestTimestamp || undefined);

                // Merge new messages with cached ones
                const newMessages = data.messages.filter(newMsg =>
                    !cachedData.messages.some(cachedMsg =>
                        cachedMsg.consensus_timestamp === newMsg.consensus_timestamp &&
                        cachedMsg.sequence_number === newMsg.sequence_number
                    )
                );

                if (newMessages.length > 0) {
                    console.log(`Found ${newMessages.length} new messages`);
                    const mergedMessages = order === 'desc'
                        ? [...newMessages, ...cachedData.messages]
                        : [...cachedData.messages, ...newMessages];

                    data.messages = mergedMessages;
                } else {
                    console.log('No new messages found');
                    data.messages = cachedData.messages;
                }
            } else {
                // Initial load or full refresh
                const fetchUrl = `${HEDERA_MIRROR_NODE_BASE_URL}/api/v1/topics/${topicId}/messages?limit=${limit}&order=${order}&encoding=${encoding}`;
                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                data = await response.json();
            }

            if (!mountedRef.current) return;

            if (isLoadMore) {
                const newMessages = [...messages, ...data.messages];
                setMessages(newMessages);
                updateCache(topicId, {
                    messages: newMessages,
                    hasMore: !!data.links.next,
                    nextUrl: data.links.next,
                });
            } else {
                setMessages(data.messages);

                // Update cache with new data
                const latestTimestamp = data.messages.length > 0
                    ? (order === 'desc' ? data.messages[0].consensus_timestamp : data.messages[data.messages.length - 1].consensus_timestamp)
                    : null;

                updateCache(topicId, {
                    messages: data.messages,
                    latestTimestamp,
                    hasMore: !!data.links.next,
                    nextUrl: data.links.next,
                });
            }

            setHasMore(!!data.links.next);
            setNextUrl(data.links.next);

        } catch (err) {
            if (mountedRef.current) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
                setError(errorMessage);
                console.error('Error fetching topic messages:', err);
            }
        } finally {
            if (mountedRef.current) {
                setLoadingState(false);
            }
        }
    }, [topicId, limit, order, encoding, getCacheKey, isCacheValid, updateCache, fetchNewMessages, messages]);

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

    const smartRefresh = useCallback(async () => {
        if (!topicId) return;
        await fetchMessages();
    }, [topicId, fetchMessages]);

    // Reset states when topicId changes or becomes null
    useEffect(() => {
        if (!topicId) {
            setMessages([]);
            setError(null);
            setLoading(false);
            setIsFromCache(false);
            setHasMore(false);
            setNextUrl(null);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Initial fetch
        fetchMessages();

        // Setup smart refresh interval
        intervalRef.current = setInterval(() => {
            if (mountedRef.current) {
                smartRefresh();
            }
        }, refetchInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [topicId]); // Only depend on topicId

    // Separate effect for setting up interval with stable functions
    useEffect(() => {
        if (!topicId) return;

        const interval = setInterval(() => {
            if (mountedRef.current) {
                smartRefresh();
            }
        }, refetchInterval);

        return () => clearInterval(interval);
    }, [topicId, refetchInterval, smartRefresh]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
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
        return base64Message; // Return original if decoding fails
    }
}

// Utility to clear cache for specific topic or all topics
export function clearMessageCache(topicId?: string) {
    if (topicId) {
        // Clear cache for specific topic patterns
        for (const [key] of messageCache) {
            if (key.startsWith(topicId)) {
                messageCache.delete(key);
            }
        }
    } else {
        // Clear all cache
        messageCache.clear();
    }
}