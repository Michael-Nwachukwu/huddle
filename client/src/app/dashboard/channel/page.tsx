"use client"
import React from 'react'
import { TopicChat } from './_components/topic-chat'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card } from '@/components/ui/card';

const Page = () => {
    const { activeWorkspace } = useWorkspace();
    return (
        <section className='p-5 h-full'>
            <Card className='p-4 h-full @container/card'>
                <TopicChat topicId={activeWorkspace?.topicId} />
            </Card>
        </section>
    )
}

export default Page