import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ChatListItemSkeleton = () => (
    <div className="flex items-center gap-4 p-3">
        <Skeleton className="h-12 w-12 rounded-full bg-gray-200/10" />
        <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4 bg-gray-200/10" />
            <Skeleton className="h-4 w-1/2 bg-gray-200/10" />
        </div>
    </div>
);

const ChatViewSkeleton = () => (
    <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 bg-whatsapp-panel-bg border-b border-whatsapp-border px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full bg-gray-200/10" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-gray-200/10" />
                <Skeleton className="h-3 w-24 bg-gray-200/10" />
            </div>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="flex justify-start">
                <Skeleton className="h-10 w-48 rounded-lg bg-gray-200/20" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-10 w-64 rounded-lg bg-green-200/10" />
            </div>
            <div className="flex justify-start">
                <Skeleton className="h-16 w-32 rounded-lg bg-gray-200/20" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-10 w-40 rounded-lg bg-green-200/10" />
            </div>
        </div>
        <div className="bg-whatsapp-panel-bg p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-full rounded-full bg-gray-200/10" />
            <Skeleton className="h-10 w-10 rounded-full bg-gray-200/10" />
        </div>
    </div>
);

const TransactionListItemSkeleton = () => (
    <div className="flex items-start gap-4 p-4 border-b border-whatsapp-border">
        <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2 bg-gray-200/10" />
            <Skeleton className="h-3 w-1/4 bg-gray-200/10" />
            <Skeleton className="h-3 w-3/4 bg-gray-200/10" />
        </div>
        <Skeleton className="h-8 w-20 rounded-md bg-gray-200/10" />
    </div>
)

export const ChatListLoader: React.FC = () => (
    <div className="h-full overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
            <ChatListItemSkeleton key={i} />
        ))}
    </div>
)

export const TransactionListLoader: React.FC = () => (
    <div className="h-full overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
            <TransactionListItemSkeleton key={i} />
        ))}
    </div>
)

export const ChatViewLoader: React.FC = () => <ChatViewSkeleton />;

export const FullScreenLoader: React.FC<{ message?: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full bg-whatsapp-bg">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div>
        {message && <p className="mt-4 text-whatsapp-text-secondary">{message}</p>}
    </div>
); 