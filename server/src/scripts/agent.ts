import { runAgent } from "../agent/loop.js";
import { callClaude } from "../agent/claude.js";
import { tools } from "../agent/tools/index.js";
import { sequelize } from "../db/connection.js";
import { API_Errors } from "../agent/api-errors.js";

try {
    const maxIterations = process.env.AGENT_MAX_ITERATIONS;
    const maxCharLength = Number(process.env.AGENT_MAX_PROMPT_LENGTH ?? 2000);
    const prompt = process.argv.slice(2).join(' ');
    if (!prompt) {
        console.error('Usage: npm run agent -- "Question to Claude"');
        process.exitCode = 1;
    } else if (prompt.length > maxCharLength) {
        console.error(`Prompt is too long, please keep it under ${maxCharLength} characters.`);
        process.exitCode = 1;
    } else if (!process.env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY is not set, please check your .env file and ensure it is properly configured.');
        process.exitCode = 1;
    } else {
        const result = await runAgent({
            question: prompt,
            callModel: callClaude,
            tools: tools,
            maxIterations: Number.isInteger(Number(maxIterations)) && Number(maxIterations) > 0 ? Number(maxIterations) : 5,
            debug: process.env.AGENT_DEBUG === 'true'
        });
        console.log(result.answer);
        if (result.hitLimit) {
            console.log('Hit the maximum iteration limit.');
        }
    }
} catch (error) {
    API_Errors(error);
}
finally {
    await sequelize.close();
}