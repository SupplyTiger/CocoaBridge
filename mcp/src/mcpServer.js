import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAnalyticsTools } from "./tools/analytics.js";

export function createMcpServer() {
  const server = new McpServer({
    name: "cocoabridge-goa",
    version: "1.0.0",
    description: "SupplyTiger procurement intelligence MCP server",
    capabilities: {
      tools: {},
    },
  });

  registerAnalyticsTools(server);

  return server;
}
