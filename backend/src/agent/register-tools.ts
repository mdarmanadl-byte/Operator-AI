import { registerTool } from "./tool-registry.js";
import { calculatorTool } from "./tools/calculator.tool.js";
import { browserTool } from "./tools/browser.tool.js";
registerTool(calculatorTool);
registerTool(browserTool);