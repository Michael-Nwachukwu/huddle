"use client"

import React from "react"
import { cn } from "@/lib/utils"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

import { ArrowUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { AutoResizeTextarea } from "./autoresize-textarea"
import { useTheme } from "@/context/theme-context"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function ChatForm({ className, ...props }: React.ComponentProps<"form">) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const { theme } = useTheme();

  const [input, setInput] = React.useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const header = (
    <header className="m-auto flex max-w-96 flex-col gap-5 text-center">
      <h1 className="text-2xl font-semibold leading-none tracking-tight">Huddle AI Chatbot Assistant</h1>
      <p className="text-muted-foreground text-sm">
        This is Huddle AI, your personal chatbot assistant. Ask me anything!
      </p>
    </header>
  )

  const messageList = (
    <div className="my-4 flex h-fit min-h-full flex-col gap-4">
      {messages.map((message, index) => (
        <div
          key={index}
          data-role={message.role}
          className="max-w-[80%] rounded-xl px-3 py-2 text-sm data-[role=assistant]:self-start data-[role=user]:self-end data-[role=assistant]:bg-neutral-800 data-[role=user]:bg-[#6b840a] data-[role=assistant]:text-neutral-100 data-[role=user]:text-white"
        >
          {message.parts.map((part, partIndex) => {
            if (part.type === "text") {
              return (
                <div key={partIndex} className="markdown-content">
                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Paragraphs
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        // Headings
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
                        // Lists
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="ml-2">{children}</li>,
                        // Tables
                        table: ({ children }) => (
                          <div className="overflow-x-auto mb-2">
                            <table className="min-w-full border-collapse border border-neutral-600">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-neutral-700">{children}</thead>,
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => <tr className="border-b border-neutral-600">{children}</tr>,
                        th: ({ children }) => <th className="border border-neutral-600 px-3 py-2 text-left font-semibold">{children}</th>,
                        td: ({ children }) => <td className="border border-neutral-600 px-3 py-2">{children}</td>,
                        // Code blocks
                        code: ({ inline, children, ...props }: any) =>
                          inline ? (
                            <code className="bg-neutral-700 px-1 py-0.5 rounded text-xs" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-neutral-900 p-2 rounded text-xs overflow-x-auto mb-2" {...props}>
                              {children}
                            </code>
                          ),
                        pre: ({ children }) => <pre className="mb-2 overflow-x-auto">{children}</pre>,
                        // Strong/Bold
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        // Emphasis/Italic
                        em: ({ children }) => <em className="italic">{children}</em>,
                        // Blockquote
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-neutral-600 pl-3 italic my-2">{children}</blockquote>
                        ),
                        // Horizontal rule
                        hr: () => <hr className="my-3 border-neutral-600" />,
                        // Links
                        a: ({ children, href }) => (
                          <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {part.text}
                    </ReactMarkdown>
                  ) : (
                    <span>{part.text}</span>
                  )}
                </div>
              )
            }
            return null
          })}
        </div>
      ))}
      {
        status === "submitted" && <div className="flex items-center gap-2 text-slate-500">
          <div className="w-8 h-8 flex items-center justify-center gap-0.5">
            <span className="block w-2 h-2 bg-[#6b840a] rounded-full animate-bounce" />
            <span className="block w-2 h-2 bg-[#6b840a] rounded-full animate-bounce duration-700" />
            <span className="block w-2 h-2 bg-[#6b840a] rounded-full animate-bounce duration-1000" />
          </div>
          <span className="text-sm">Huddle Ai is thinking...</span>
        </div>
      }
    </div>
  )

  return (
    <TooltipProvider>
      <main
        className={cn(
          "ring-none mx-auto flex h-full max-h-svh w-full lg:max-w-[45rem] flex-col items-stretch border-none",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-1 justify-center">
          {theme === "dark" ? (
            <Image
              src={"/logo-dark.svg"}
              alt="Huddle"
              className="w-28"
              width={60}
              height={40}
            />
          ) : (
            <Image
              src={"/logo-light-2.svg"}
              alt="Huddle"
              className="w-28"
              width={60}
              height={40}
            />
          )}
          <h1 className="text-2xl italic font-light">AI</h1>
        </div>
        <div className="flex-1 content-center overflow-y-auto px-6">
          {messages.length ? messageList : header}
        </div>
        <form
          onSubmit={handleSubmit}
          className="border-input bg-background focus-within:ring-ring/10 relative mx-6 mb-6 flex items-center rounded-[16px] border px-3 py-1.5 pr-8 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0"
        >
          <AutoResizeTextarea
            onKeyDown={handleKeyDown}
            onChange={(v) => setInput(v)}
            value={input}
            placeholder="Enter a message"
            className="placeholder:text-muted-foreground flex-1 bg-transparent focus:outline-none"
            disabled={status === "submitted"}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-1 right-1 size-6 rounded-full"
                disabled={status === "submitted"}
              >
                <ArrowUpIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={12}>Submit</TooltipContent>
          </Tooltip>
        </form>
      </main>
    </TooltipProvider>
  )
}
