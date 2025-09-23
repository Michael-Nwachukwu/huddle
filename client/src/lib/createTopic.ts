import {
    Client,
    TopicCreateTransaction
} from "@hashgraph/sdk";


export async function main(topic: string) {

    // Load your operator credentials
    const operatorId = process.env.NEXT_PUBLIC_OPERATOR_ID || "";
    const operatorKey = process.env.NEXT_PUBLIC_OPERATOR_KEY || "";

    // Initialize your testnet client and set operator
    const client = Client.forTestnet()
        .setOperator(operatorId, operatorKey);

    // Build and send the transaction
    const txResponse = await new TopicCreateTransaction()
        .setTopicMemo(topic)
        .execute(client);

    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(`\nTopic created: ${topicId?.toString()}`);

    return topicId?.toString();
}
