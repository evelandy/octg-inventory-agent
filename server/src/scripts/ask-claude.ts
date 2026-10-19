import path from 'node:path';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

// 1. Setup:
dotenv.config({ path: path.resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

const prompt = process.argv.slice(2).join(' ');
if (!prompt) {
  console.error('Usage: npm run claude:ask -- "Question to Claude"');
  process.exit(1);
}

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

try {
  // 2. Request:
  const response = await client.beta.messages.create({
    // model: 'claude-opus-5',
    model: 'claude-haiku-4-5',
    max_tokens: 1600, // Adjust as needed default is 16000
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages: [{ role: 'user', content: prompt }],
  });

  // 3. Read reply:
  if (response.stop_reason === 'refusal') {
    console.error('Claude declined:', response.stop_details?.category ?? 'no category');
    process.exitCode = 1;
  } else {
    for (const block of response.content) {
      if (block.type === 'text') {
        console.log(block.text);
        console.log(`Input tokens: ${response.usage.input_tokens}`);
        console.log(`Output tokens: ${response.usage.output_tokens}`);
      }
    }
    if (response.stop_reason === 'max_tokens') {
        console.warn('\n(reply was cut off at max_tokens)');
    }
  }
} catch (error) {
  // 4. Errors:
  if (error instanceof Anthropic.AuthenticationError) {
    console.error('Invalid or missing ANTHROPIC_API_KEY');
  } else if (error instanceof Anthropic.RateLimitError) {
    console.error('Rate limited, try again shortly');
  } else if (error instanceof Anthropic.APIError) {
    console.error(`API error: ${error.message}, the API could not be reached.`);
  } else if (error instanceof Anthropic.InternalServerError) {
    console.error(`Internal server error: ${error.message}`);
  } else {
    throw error;
  }
  process.exitCode = 1;
}
