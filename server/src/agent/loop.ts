import type Anthropic from '@anthropic-ai/sdk';
import type { AgentTool } from './tools/types.js';

type RunAgentParams = {
    question: string;
    callModel: (messages: Anthropic.MessageParam[]) => Promise<Anthropic.Message>;
    tools: AgentTool[];
    maxIterations: number;
};

type RunAgentResult = {
    answer: string;
    hitLimit: boolean;
};

const runAgent = async ({ question, callModel, tools, maxIterations }: RunAgentParams): Promise<RunAgentResult> => {
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: question }];
    for (let i = 0; i < maxIterations; i++) {
        const response = await callModel(messages);
        const content = response.content;
        if (response.stop_reason !== 'tool_use') {
            const filteredContent = content.filter((block) => block.type === 'text');
            return { answer: filteredContent.map((block) => block.text).join(''), hitLimit: false };
        }
        messages.push({ role: 'assistant', content: content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const block of content.filter((block) => block.type === 'tool_use')) {
            try {
                const tool = tools.find((tool) => tool.name === block.name);
                if (!tool) {
                    const answer = `Error, Unknown tool: ${block.name}`;
                    results.push({ type: 'tool_result', tool_use_id: block.id, content: answer, is_error: true });
                } else {
                    const input = tool.inputSchema.parse(block.input);
                    const result = await tool.handler(input);
                    results.push({ type: 'tool_result', tool_use_id: block.id, content: result });
                }
            } catch (error) {
                const answer = `Error, Unknown tool: ${block.name}: ${error instanceof Error ? error.message : String(error)}`;
                results.push({ type: 'tool_result', tool_use_id: block.id, content: answer, is_error: true });
            }
        }
        messages.push({ role: 'user', content: results });
    }
    const answer = `Stopped after ${maxIterations} steps without reaching a final answer. Try a more specific question, or raise the step limit.`;
    const hitLimit = true;
    return {answer, hitLimit};
};

export { runAgent };