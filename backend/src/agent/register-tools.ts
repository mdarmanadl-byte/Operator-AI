import { registerTool } from "./tool-registry.js";
import { calculatorTool } from "./tools/calculator.tool.js";
import { crmTool } from "../tools/crm.tools.js";
registerTool(calculatorTool);
registerTool(crmTool);