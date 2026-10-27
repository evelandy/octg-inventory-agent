import { runAgent } from "../agent/loop.js";
import { callClaude } from "../agent/claude.js";
import { tools } from "../agent/tools/index.js";
import { sequelize } from "../db/connection.js";
import { API_Errors } from "../agent/api-errors.js";

try {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY is not set, please check your .env file and ensure it is properly configured.');
        process.exitCode = 1;
    }
    const result = await runAgent({
        question: 'What yards do we have?',
        callModel: callClaude,
        tools: tools,
        maxIterations: 5
    });
    console.log(result.answer);
    if (result.hitLimit) {
        console.log('Hit the maximum iteration limit.');
    }
} catch (error) {
    API_Errors(error);
}
 finally {
    await sequelize.close();
}