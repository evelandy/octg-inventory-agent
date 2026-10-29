import { sequelize } from "../../db/connection.js"
import { QueryTypes } from "sequelize";
import type { AgentTool } from "./types.ts";
import { z } from "zod";

export const listYards: AgentTool = {
    name: "list_yards",
    description: "Returns every yard with its name and region. Use it when the user asks which yards exist, where a yard is, or needs a yard name for another question.",
    inputSchema: z.object({}),
    handler: async () => {
        const yards = await sequelize.query<{ name: string; region: string }>(
            "SELECT name, region FROM yards ORDER BY name",
            { type: QueryTypes.SELECT }
        );
        return JSON.stringify(yards);
    }
};