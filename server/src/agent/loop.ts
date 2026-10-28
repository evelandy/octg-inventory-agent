import type Anthropic from '@anthropic-ai/sdk';
import type { AgentTool } from './tools/types.js';
import { error } from 'console';

type RunAgentParams = {
    question: string;
    callModel: (messages: Anthropic.MessageParam[]) => Promise<Anthropic.Message>;
    tools: AgentTool[];
    maxIterations: number;
    debug: boolean;
};

type RunAgentResult = {
    answer: string;
    hitLimit: boolean;
};

const runAgent = async ({ question, callModel, tools, maxIterations, debug }: RunAgentParams): Promise<RunAgentResult> => {
    const errorMessage = error instanceof Error ? (error.message || error.name) : String(error);
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: question }];
    for (let i = 0; i < maxIterations; i++) {
        const response = await callModel(messages);
        if (debug) {
            console.error(`[round ${i + 1}]`);
            console.error(`tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);
        }
        const content = response.content;
        if (response.stop_reason !== 'tool_use') {
            const filteredContent = content.filter((block) => block.type === 'text');
            if (debug) {
                console.error(`no tool calls -> final answer`);
            }
            return { answer: filteredContent.map((block) => block.text).join(''), hitLimit: false };
        }
        messages.push({ role: 'assistant', content: content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const block of content.filter((block) => block.type === 'tool_use')) {
            try {
                const tool = tools.find((tool) => tool.name === block.name);
                if (!tool) {
                    const answer = `Error, Unknown tool: ${block.name}`;
                    if (debug) {
                        console.error(`unknown tool: ${block.name}`);
                    }
                    results.push({ type: 'tool_result', tool_use_id: block.id, content: answer, is_error: true });
                } else {
                    const input = tool.inputSchema.parse(block.input);
                    const result = await tool.handler(input);
                    if (debug) {
                        console.error(`tool ${block.name} input=${JSON.stringify(block.input)} -> result ${result.length} characters`)
                    }
                    results.push({ type: 'tool_result', tool_use_id: block.id, content: result });
                }
            } catch (error) {
                const answer = `Tool ${block.name} failed: ${errorMessage}`;
                if (debug) {
                    console.error(`tool ${block.name} failed: ${errorMessage}`);
                }
                results.push({ type: 'tool_result', tool_use_id: block.id, content: answer, is_error: true });
            }
        }
        messages.push({ role: 'user', content: results });
    }
    const answer = `Stopped at the ${maxIterations}-step limit without reaching a final answer. Try a more specific question, or raise the step limit.`;
    const hitLimit = true;
    return {answer, hitLimit};
};

export { runAgent };