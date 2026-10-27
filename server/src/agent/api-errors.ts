import Anthropic from "@anthropic-ai/sdk";

const apiErrors = {
    AuthenticationError: 'Invalid or missing ANTHROPIC_API_KEY',
    RateLimitError: 'Rate limited, try again shortly',
    InternalServerError: (message: string) => `Internal server error: ${message}`,
    APIError: (message: string) => `API error: ${message}, the API could not be reached.`,
    APIConnectionError: `Could not reach the Claude API. Please check your network connection and try again.`,
};

const API_Errors = (error: unknown) => {
    if (error instanceof Anthropic.AuthenticationError) {
        console.error(apiErrors.AuthenticationError);
    } else if (error instanceof Anthropic.RateLimitError) {
        console.error(apiErrors.RateLimitError);
    } else if (error instanceof Anthropic.InternalServerError) {
        console.error(apiErrors.InternalServerError(error.message));
    } else if (error instanceof Anthropic.APIConnectionError) {
        console.error(apiErrors.APIConnectionError);
    } else if (error instanceof Anthropic.APIError) {
        console.error(apiErrors.APIError(error.message));
    } else {
        throw error;
    }
};

export { API_Errors };