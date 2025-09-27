// app/api/topics/submit-message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client, TopicMessageSubmitTransaction } from "@hashgraph/sdk";

export async function POST(request: NextRequest) {
    try {
        const { topicId, message } = await request.json();

        if (!topicId || typeof topicId !== 'string') {
            return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
        }

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (message.trim().length === 0) {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }

        if (message.length > 1024) {
            return NextResponse.json({
                error: 'Message too long. Maximum 1024 characters allowed.'
            }, { status: 400 });
        }

        console.log("Submitting message to topic:", topicId);

        // Validate environment variables
        const operatorId = process.env.HEDERA_OPERATOR_ID;
        const operatorKey = process.env.HEDERA_OPERATOR_KEY;

        if (!operatorId || !operatorKey) {
            console.error("Missing environment variables for Hedera");
            return NextResponse.json({
                error: "Server configuration error. Missing Hedera credentials."
            }, { status: 500 });
        }

        // Initialize Hedera client
        const client = Client.forTestnet().setOperator(operatorId, operatorKey);

        try {
            // Submit message to topic
            const txResponse = await new TopicMessageSubmitTransaction({
                topicId: topicId,
                message: message.trim(),
            }).execute(client);

            const receipt = await txResponse.getReceipt(client);
            const transactionId = txResponse.transactionId;

            console.log(`Message submitted successfully to topic ${topicId}`);
            console.log(`Transaction ID: ${transactionId?.toString()}`);

            return NextResponse.json({
                success: true,
                topicId: topicId,
                transactionId: transactionId?.toString(),
                message: message.trim(),
                timestamp: new Date().toISOString(),
                sequenceNumber: receipt.topicSequenceNumber?.toString()
            });

        } catch (submitError: any) {
            console.error(`Error submitting message to topic:`, submitError.message);

            // Handle specific Hedera errors
            let errorMessage = 'Failed to submit message to topic';
            if (submitError.message.includes('INVALID_TOPIC_ID')) {
                errorMessage = 'Invalid topic ID';
            } else if (submitError.message.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
                errorMessage = 'Insufficient account balance for transaction';
            } else if (submitError.message.includes('TOPIC_EXPIRED')) {
                errorMessage = 'Topic has expired';
            }

            return NextResponse.json({
                error: errorMessage,
                details: submitError.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Submit message API error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}