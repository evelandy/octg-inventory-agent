import { strict as assert } from 'node:assert';
import type Anthropic from '@anthropic-ai/sdk';
import { runAgent } from '../src/agent/loop.js';
import type { AgentTool } from '../src/agent/tools/types.js';
import { z } from 'zod';

const fakeReply = (stopReason: Anthropic.Message['stop_reason'], content: Anthropic.Message['content']): Anthropic.Message => ({
    stop_reason: stopReason,
    content,
    usage: { input_tokens: 0, output_tokens: 0 }
}) as Anthropic.Message;

const makeFakeModel = (replies: Anthropic.Message[]) => {
    const calls: Anthropic.MessageParam[][] = [];

    const callModel = async (messages: Anthropic.MessageParam[]) => {
        calls.push(structuredClone(messages));
        const reply = replies[calls.length - 1];
        if (!reply) {
            throw new Error(`Fake model ran out of scripted replies`);
        }
        return reply;
    };

    return { callModel, calls };
};

const fakeTool: AgentTool = {
    name: 'fake_tool',
    description: 'A test tool that always works',
    inputSchema: z.object({}),
    handler: async () => 'fake data',
};

const brokenTool: AgentTool = {
    name: 'broken_tool',
    description: 'A test tool that always fails',
    inputSchema: z.object({}),
    handler: async () => {
        throw new Error('database unreachable');
    },
};

describe('runAgent', () => {
    // a
    it('answers with no tool calls', async () => {
        const { callModel, calls } = makeFakeModel([
            fakeReply('end_turn', [{ type: 'text', text: '4', citations: null }]),
        ]);

        const result = await runAgent({ question: 'What is 2 + 2?', callModel, tools: [], maxIterations: 5, debug: false });
        assert.equal(result.answer, '4');
        assert.equal(result.hitLimit, false);
        assert.equal(calls.length, 1);
    });

    // b
    it('handles tool calls', async () => {
        const { callModel, calls } = makeFakeModel([
            fakeReply('tool_use', [{ type: 'tool_use', id: 'toolu_1', name: 'fake_tool', input: {}, caller: { type: 'direct' } }]),
            fakeReply('end_turn', [{ type: 'text', text: 'There are 2 yards', citations: null }]),
        ]);

        const result = await runAgent({ question: 'What yards do we have?', callModel, tools: [fakeTool], maxIterations: 5, debug: false });
        assert.equal(result.answer, 'There are 2 yards');
        assert.equal(result.hitLimit, false);
        assert.equal(calls.length, 2);
        assert.deepEqual(calls[1]?.at(-1), {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: 'fake data' }],
        });
    });

    // c
    it('handles broken tools', async () => {
        const { callModel, calls } = makeFakeModel([
            fakeReply('tool_use', [{ type: 'tool_use', id: 'toolu_1', name: 'broken_tool', input: {}, caller: { type: 'direct' } }]),
            fakeReply('end_turn', [{ type: 'text', text: 'database unreachable', citations: null }]),
        ]);

        const result = await runAgent({ question: 'What yards do we have?', callModel, tools: [brokenTool], maxIterations: 5, debug: false });
        assert.equal(result.answer, 'database unreachable');
        assert.equal(result.hitLimit, false);
        assert.equal(calls.length, 2);
        assert.deepEqual(calls[1]?.at(-1), {
            role: 'user',
            content: [{
                type: 'tool_result',
                tool_use_id: 'toolu_1',
                content: 'Tool broken_tool failed: database unreachable',
                is_error: true,
            }],
        });
    });

    // d
    it('hits iteration limit', async () => {
        const { callModel, calls } = makeFakeModel([
            fakeReply('tool_use', [{ type: 'tool_use', id: 'toolu_1', name: 'fake_tool', input: {}, caller: { type: 'direct' } }]),
            fakeReply('tool_use', [{ type: 'tool_use', id: 'toolu_1', name: 'fake_tool', input: {}, caller: { type: 'direct' } }]),
            fakeReply('tool_use', [{ type: 'tool_use', id: 'toolu_1', name: 'fake_tool', input: {}, caller: { type: 'direct' } }]),
        ]);

        const result = await runAgent({ question: 'What yards do we have?', callModel, tools: [fakeTool], maxIterations: 3, debug: false });
        assert.equal(result.hitLimit, true);
        assert.equal(calls.length, 3);
    });
});
