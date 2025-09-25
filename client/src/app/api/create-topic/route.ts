import { NextRequest, NextResponse } from 'next/server';
import { Client, TopicCreateTransaction } from "@hashgraph/sdk";

export async function POST(request: NextRequest) {
    try {
        const { topicMemo } = await request.json();

        if (!topicMemo || typeof topicMemo !== 'string') {
            return NextResponse.json({ error: 'Topic memo is required' }, { status: 400 });
        }

        console.log("Creating topic with memo:", topicMemo);

        // Validate environment variables
        const operatorId = process.env.HEDERA_OPERATOR_ID;
        const operatorKey = process.env.HEDERA_OPERATOR_KEY;

        if (!operatorId || !operatorKey) {
            console.error("Missing environment variables for Hedera");
            return NextResponse.json({
                error: "Missing OPERATOR_ID or OPERATOR_KEY in environment variables"
            }, { status: 500 });
        }

        // Initialize Hedera client
        const client = Client.forTestnet().setOperator(operatorId, operatorKey);

        try {
            // Create the topic transaction
            const txResponse = await new TopicCreateTransaction()
                .setTopicMemo(topicMemo)
                .execute(client);

            const receipt = await txResponse.getReceipt(client);
            const topicId = receipt.topicId;

            console.log(`Topic created successfully: ${topicId?.toString()}`);

            return NextResponse.json({
                success: true,
                topicId: topicId?.toString(),
                memo: topicMemo
            });

        } catch (topicError: any) {
            console.error(`Error creating topic:`, topicError.message);
            return NextResponse.json({
                error: 'Failed to create topic',
                details: topicError.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Create topic API error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}