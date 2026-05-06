import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import type {
    StreamChatParams,
    StreamChatResult,
    NormalizedToolCall,
    NormalizedToolResult,
} from "./types";
import * as fs from "fs";
import * as path from "path";

const RAW_STREAM_LOG_PATH = path.resolve(
    process.cwd(),
    "azure-raw-stream.log",
);

function client(override?: string | null): OpenAIClient {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
    const apiKey = override?.trim() || process.env.AZURE_OPENAI_API_KEY || "";
    return new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
}

// Simple guardrail check implementation
async function checkContentSafety(text: string): Promise<boolean> {
    // In a full implementation, you would call Azure AI Content Safety API here.
    // E.g., analyzing for Hate, Sexual, SelfHarm, Violence.
    // For now, this is a placeholder application-layer guardrail block.
    console.log("[Guardrail] Checking content safety...");
    const blockedTerms = ["unsafe_word", "malicious_term"]; // Placeholder list
    for (const term of blockedTerms) {
        if (text.toLowerCase().includes(term)) {
            return false;
        }
    }
    return true;
}

export async function streamAzure(
    params: StreamChatParams,
): Promise<StreamChatResult> {
    const {
        model,
        systemPrompt,
        tools = [],
        callbacks = {},
        runTools,
        apiKeys,
    } = params;
    
    // Check system prompt guardrails
    if (!(await checkContentSafety(systemPrompt))) {
        throw new Error("System prompt violates safety guardrails.");
    }
    for (const m of params.messages) {
         if (!(await checkContentSafety(m.content))) {
             throw new Error("User prompt violates safety guardrails.");
         }
    }

    const maxIter = params.maxIterations ?? 10;
    const azureClient = client(apiKeys?.claude); // reusing apiKey type temporarily
    
    // Convert generic tools to Azure/OpenAI tools format
    const azureTools = tools.map((t) => ({
        type: "function" as const,
        function: {
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters,
        },
    }));

    const messages: any[] = [];
    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }
    messages.push(...params.messages);

    let fullText = "";

    for (let iter = 0; iter < maxIter; iter++) {
        const events = await azureClient.streamChatCompletions(
            model,
            messages,
            {
                tools: azureTools.length ? azureTools : undefined,
                temperature: 0.7,
            }
        );

        let iterText = "";
        let toolCallMap: Record<number, any> = {};

        for await (const event of events) {
            const line = JSON.stringify(event);
            fs.appendFile(RAW_STREAM_LOG_PATH, line + "\n", () => {});
            
            for (const choice of event.choices) {
                if (choice.delta?.content) {
                    iterText += choice.delta.content;
                    fullText += choice.delta.content;
                    callbacks.onContentDelta?.(choice.delta.content);
                }
                
                if (choice.delta?.toolCalls) {
                    for (const tc of choice.delta.toolCalls) {
                        const index = tc.index || 0;
                        if (!toolCallMap[index]) {
                            toolCallMap[index] = {
                                id: tc.id,
                                name: tc.function?.name || "",
                                arguments: tc.function?.arguments || "",
                            };
                        } else {
                            if (tc.function?.arguments) {
                                toolCallMap[index].arguments += tc.function.arguments;
                            }
                        }
                    }
                }
            }
        }
        
        // Guardrail on completion
        if (!(await checkContentSafety(iterText))) {
            throw new Error("Generated content violates safety guardrails.");
        }

        const toolCalls: NormalizedToolCall[] = Object.values(toolCallMap).map((tc: any) => ({
            id: tc.id,
            name: tc.name,
            input: JSON.parse(tc.arguments || "{}"),
        }));

        if (!toolCalls.length || !runTools) {
            break;
        }

        for (const tc of toolCalls) {
            callbacks.onToolCallStart?.(tc);
        }

        const results = await runTools(toolCalls);

        messages.push({ role: "assistant", content: iterText, toolCalls: Object.values(toolCallMap) });
        
        for (const r of results) {
            messages.push({
                role: "tool",
                toolCallId: r.tool_use_id,
                content: r.content,
            });
        }
    }

    return { fullText };
}

export async function completeAzureText(params: {
    model: string;
    systemPrompt?: string;
    user: string;
    maxTokens?: number;
    apiKeys?: { claude?: string | null };
}): Promise<string> {
    // Content safety guardrail on prompt
    if (!(await checkContentSafety(params.user))) {
        throw new Error("User prompt violates safety guardrails.");
    }
    
    const azureClient = client(params.apiKeys?.claude);
    const messages: any[] = [];
    if (params.systemPrompt) {
        messages.push({ role: "system", content: params.systemPrompt });
    }
    messages.push({ role: "user", content: params.user });

    const resp = await azureClient.getChatCompletions(
        params.model,
        messages,
        { maxTokens: params.maxTokens ?? 512 }
    );

    const text = resp.choices[0]?.message?.content || "";
    
    // Content safety guardrail on completion
    if (!(await checkContentSafety(text))) {
        throw new Error("Generated content violates safety guardrails.");
    }
    
    return text;
}
