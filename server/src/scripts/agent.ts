import { runAgent } from "../agent/loop.js";
import { callClaude } from "../agent/claude.js";
import { tools } from "../agent/tools/index.js";
import { sequelize } from "../db/connection.js";

try {
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
} finally {
    await sequelize.close();
}