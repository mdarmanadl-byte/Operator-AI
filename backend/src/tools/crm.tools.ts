import type { AgentTool, ToolResult } from "../agent/tool-registry.js";
import { browserTool } from "../agent/tools/browser.tool.js";

function normalizeInstruction(instruction: string): string | null {
  const text = instruction.trim();

  const search = text.match(
    /^(?:search|find|list|show) contacts(?:\s+(?:matching|named|for|with status)\s+(.+?))?[.!?]?$/i,
  );

  if (search) {
    const query = search[1]?.trim();
    return query ? `search contacts matching ${query}` : "search contacts";
  }

  const qualify = text.match(
    /^(?:mark|update)\s+contact\s+(.+?)\s+(?:as\s+qualified|to\s+qualified)[.!]?$/i,
  );

  if (qualify?.[1]) {
    return `mark contact ${qualify[1].trim()} as qualified`;
  }

  return null;
}

export const crmTool: AgentTool = {
  name: "crm",
  description:
    "Search contacts in the Demo CRM and mark a specific contact as qualified using Playwright. Returns observed contact data and verification evidence.",

  canHandle(instruction: string): boolean {
    return normalizeInstruction(instruction) !== null;
  },

  async execute(instruction: string): Promise<ToolResult> {
    const normalized = normalizeInstruction(instruction);

    if (!normalized) {
      throw new Error(
        "Unsupported CRM instruction. Use 'search contacts', " +
          "'search contacts matching Alice', or " +
          "'mark contact Alice Johnson as qualified'.",
      );
    }

    return browserTool.execute(normalized);
  },

  async verify(
    instruction: string,
    result: ToolResult,
  ): Promise<boolean> {
    const normalized = normalizeInstruction(instruction);

    if (!normalized) return false;

    return browserTool.verify(normalized, result);
  },
};
