import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const prompt = convertToModelMessages(messages)

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),
    messages: prompt,
    system: "You are a helpful assistant.",
  })

  return result.toUIMessageStreamResponse()
}
