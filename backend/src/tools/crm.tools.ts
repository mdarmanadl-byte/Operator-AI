import type { AgentTool, ToolResult } from "../agent/tool-registry.js";
import { browserTool } from "../agent/tools/browser.tool.js";
import { z } from "zod";
function normalizeInstruction(instruction: string): string | null {
  const text = instruction.trim();

  
    const search = text.match(
  /^(?:search|find|list|show)\s+contacts?(?:\s+(?:matching|named|for|with status)\s+(.+?))?[.!?]?$/i,
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
const CrmInputSchema = z.object({
  instruction: z.string().min(1),
});

export const crmTool = {
  name: "crm",
  description: "Search and update contacts in the Demo CRM.",
  parameters: CrmInputSchema,

  canHandle(instruction: string): boolean {
    return normalizeInstruction(instruction) !== null;
  },

async execute(
  instruction: string,
  signal?: AbortSignal,
): Promise<ToolResult> {
  if (signal?.aborted) {
    throw new Error("Task execution cancelled");
  }

  const normalized = normalizeInstruction(instruction);

  if (!normalized) {
    throw new Error(`Unsupported CRM instruction: ${instruction}`);
  }

  return browserTool.execute(normalized, signal);
},
    async verify(
    instruction: string,
    result: ToolResult,
  ): Promise<boolean> {
    const normalized = normalizeInstruction(instruction);

    if (!normalized) {
      return false;
    }

    return browserTool.verify(normalized, result);
  },
};

export const searchContactsTool = {
  ...crmTool,
  name: "search_contacts",
  description: "Search contacts in the Demo CRM.",

  canHandle(instruction: string): boolean {
    return /^(?:search|find|list|show)\s+contacts(?:\s+(?:matching|named|for)\s+.+)?[.!?]?$/i.test(
      instruction.trim(),
    );
  },
};

export const getContactTool= {
  ...crmTool,
  name: "get_contact",
  description: "Retrieve a contact from the Demo CRM.",

  canHandle(instruction: string): boolean {
    return /^(?:get|retrieve|fetch|view)\s+contact\s+.+$/i.test(
      instruction.trim(),
    );
  },
};

export const updateContactStatusTool = {
  ...crmTool,
  name: "update_contact_status",
  description: "Update a contact's status in the Demo CRM.",

  canHandle(instruction: string): boolean {
    return /^(?:mark|update)\s+contact\s+.+\s+(?:as\s+qualified|to\s+qualified)[.!]?$/i.test(
      instruction.trim(),
    );
  },
};