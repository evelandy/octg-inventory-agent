import { listYards } from "../agent/tools/list-yards.js";
import { sequelize } from "../db/connection.js";

listYards.handler({}).then(console.log).finally(() => sequelize.close());