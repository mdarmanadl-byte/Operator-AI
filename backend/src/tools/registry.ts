import { z } from "zod";
import {
  searchContactsTool,
  getContactTool,
  updateContactStatusTool,
} from "./crm.tools.js";

export interface AgentTool {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
  canHandle: (instruction: string) => boolean;
  execute: (input: any) => Promise<unknown>;
  verify?: (instruction: string, result: any) => Promise<boolean>;
}

const tools: AgentTool[] = [
  {
    ...searchContactsTool,
    canHandle: (instruction: string) =>
      /\b(search|find|look up|list|show)\b/i.test(instruction) &&
      /\b(contact|contacts|customer|customers|lead|leads)\b/i.test(instruction),
  },
  {
    ...getContactTool,
    canHandle: (instruction: string) =>
      /\b(get|retrieve|fetch|view|show)\b/i.test(instruction) &&
      /\b(contact|customer|lead)\b/i.test(instruction) &&
      /\b(id|identifier)\b/i.test(instruction),
  },
  {
    ...updateContactStatusTool,
    canHandle: (instruction: string) =>
      /\b(update|change|set|mark)\b/i.test(instruction) &&
      /\b(status|stage|qualification)\b/i.test(instruction),
  },
];

export function listTools(): AgentTool[] {
  return [...tools];
}

export function getTool(name: string): AgentTool | undefined {
  return tools.find((tool) => tool.name === name);
}

export async function executeTool(
  name: string,
  input: unknown,
): Promise<unknown> {
  const tool = getTool(name);

  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const parsed = tool.parameters.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid tool input",
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  return tool.execute(parsed.data);
}