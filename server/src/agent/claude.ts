import Anthropic from '@anthropic-ai/sdk';
import type { AgentTool } from './tools/types.js';
import { z } from 'zod';
import { tools } from './tools/index.js';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function toClaudeTool(tool: AgentTool): Anthropic.Tool {
    const schema = z.toJSONSchema(tool.inputSchema);
    if(schema.type !== 'object') {
        throw new Error(`Tool ${tool.name} input schema must be an object`);
    }
	return {
		name: tool.name,
		description: tool.description,
		input_schema: {...schema, type: 'object'},
	};
};

export const callClaude = async (messages: Anthropic.MessageParam[]) => {
    const reply = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1000,
        messages,
        tools: tools.map(toClaudeTool),
    });
    return reply;
}
