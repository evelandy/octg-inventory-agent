import { z } from "zod";

export type AgentTool = {
    name: string;
    description: string;
    inputSchema: z.ZodType;
    handler: (input: unknown) => Promise<string>;
};
