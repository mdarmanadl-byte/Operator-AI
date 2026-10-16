export interface ToolResult {
  output: string;
  evidence: Record<string, unknown>;
}

export interface AgentTool {
  name: string;
  description: string;
  
  canHandle(instruction: string): boolean;

  execute(instruction: string , signal?: AbortSignal,): Promise<ToolResult>;

  verify(
    instruction: string,
    result: ToolResult,
  ): Promise<boolean>;
}

const tools = new Map<string, AgentTool>();

export function registerTool(tool: AgentTool): void {
  if (tools.has(tool.name)) {
    throw new Error(`Tool "${tool.name}" is already registered`);
  }

  tools.set(tool.name, tool);
}

export function getTool(name: string): AgentTool | undefined {
  return tools.get(name);
}

export function findTool(
  instruction: string,
): AgentTool | undefined {
  return Array.from(tools.values()).find((tool) =>
    tool.canHandle(instruction),
  );
}

export function listTools(): Array<{
  name: string;
  description: string;
}> {
  return Array.from(tools.values()).map(({ name, description }) => ({
    name,
    description,
  }));
}