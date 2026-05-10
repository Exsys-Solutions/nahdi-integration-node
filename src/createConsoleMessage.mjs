/**
 *
 * Helper: `createConsoleMessage`.
 *
 */
import chalk from "chalk";

const LEVELS = {
  info: { color: chalk.cyan, icon: "ℹ", label: "INFO" },
  success: { color: chalk.green, icon: "✔", label: "SUCCESS" },
  warning: { color: chalk.yellow, icon: "⚠", label: "WARNING" },
  error: { color: chalk.red, icon: "✖", label: "ERROR" },
};

const SERVER_PREFIX = chalk.bold.white("nahdi-server");

/**
 * @param {"info" | "success" | "warning" | "error"} type
 * @param {string} message
 */
function createConsoleMessage(type, message) {
  const level = LEVELS[type];

  if (!level) {
    throw new Error(
      `Unknown message type "${type}". Use: ${Object.keys(LEVELS).join(", ")}`,
    );
  }

  const { color, icon, label } = level;

  const timestamp = chalk.gray(
    `[${SERVER_PREFIX} ${new Date().toISOString()}]`,
  );
  const prefix = color.bold(`${icon}  ${label}:`);
  const output = `${timestamp} ${prefix} ${color(message)}`;

  if (type === "error") {
    console.error(output);
  } else if (type === "warning") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export default createConsoleMessage;
