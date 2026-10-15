import { chromium } from "playwright";
import type { AgentTool, ToolResult } from "../tool-registry.js";

interface QualificationRequest {
  contactName: string;
}

function parseInstruction(
  instruction: string,
): QualificationRequest | null {
  const match = instruction.match(
    /^\s*mark contact (.+?) as qualified[.!]?\s*$/i,
  );

  if (!match) {
    return null;
  }

  return {
    contactName: match[1].trim(),
  };
}

export const browserTool: AgentTool = {
  name: "browser",

  description:
    "Uses Playwright to mark a contact as qualified in the demo CRM and verify the resulting status.",

  canHandle(instruction: string): boolean {
    return parseInstruction(instruction) !== null;
  },

  async execute(instruction: string): Promise<ToolResult> {
    const request = parseInstruction(instruction);

    if (!request) {
      throw new Error("Unsupported browser instruction");
    }

    const browser = await chromium.launch({
      headless: true,
    });

    try {
      const page = await browser.newPage();

      const baseUrl =
        process.env.CRM_DEMO_URL ??
        "http://localhost:3000/demo-crm.html";

      await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      await page.getByRole("heading", {
        name: "Demo CRM",
      }).waitFor();

      const rows = page
        .getByTestId("contact-row")
        .filter({ hasText: request.contactName });

      const count = await rows.count();

      if (count !== 1) {
        throw new Error(
          `Expected one contact named "${request.contactName}", found ${count}`,
        );
      }

      const row = rows.first();

      const actualName = (
        await row.getAttribute("data-contact-name")
      )?.trim();

      if (
        actualName?.toLowerCase() !==
        request.contactName.toLowerCase()
      ) {
        throw new Error("Contact name verification failed");
      }

      const status = row.getByTestId("contact-status");

      const previousStatus = (
        await status.innerText()
      ).trim();

      if (previousStatus === "Qualified") {
        return {
          output: `${request.contactName} is already qualified.`,
          evidence: {
            contactName: request.contactName,
            previousStatus,
            finalStatus: previousStatus,
            url: page.url(),
            action: "mark_qualified",
            alreadyQualified: true,
          },
        };
      }

      await row
        .getByTestId("qualify-contact")
        .click();

      await page
        .getByRole("status")
        .getByText(
          `${request.contactName} marked as Qualified.`,
        )
        .waitFor();

      const finalStatus = (
        await status.innerText()
      ).trim();

      return {
        output: `${request.contactName} marked as ${finalStatus}.`,
        evidence: {
          contactName: request.contactName,
          previousStatus,
          finalStatus,
          url: page.url(),
          action: "mark_qualified",
          verified: finalStatus === "Qualified",
        },
      };
    } finally {
      await browser.close();
    }
  },

  async verify(
    instruction: string,
    result: ToolResult,
  ): Promise<boolean> {
    const request = parseInstruction(instruction);

    if (!request) {
      return false;
    }

    return (
      result.evidence.contactName === request.contactName &&
      result.evidence.finalStatus === "Qualified" &&
      (
        result.evidence.verified === true ||
        result.evidence.alreadyQualified === true
      )
    );
  },
};