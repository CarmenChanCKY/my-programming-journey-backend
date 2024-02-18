import winston, { format } from "winston";

winston.loggers.add("fileLogger", {
  transports: [
    new winston.transports.File({
      filename:
        process.env.NODE_ENV === "development"
          ? "my_programming_journey_dev.log"
          : "my_programming_journey.log",
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.printf(
      (info: any) => `${info.timestamp} [${info.level}] ${info.message}`
    ),
    format.errors({ stack: true })
  ),
});

if (process.env.NODE_ENV === "development") {
  winston.loggers.add("consoleLogger", {
    transports: [new winston.transports.Console()],
    exitOnError: false,
    format: format.combine(
      format.colorize(),
      format.simple(),
      format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      format.printf(
        (info: any) => `${info.timestamp} [${info.level}] ${info.message}`
      ),
      format.errors({ stack: true })
    ),
  });
}

const fileLogger = winston.loggers.get("fileLogger");

const writeInfoLog = (message: string) => {
  fileLogger.info(message);
};

const writeErrorLog = (message: string) => {
  fileLogger.error(message);
};

const writeConsoleLog = (type: string, message: string) => {
  if (process.env.NODE_ENV === "development") {
    const consoleLogger = winston.loggers.get("consoleLogger");
    consoleLogger.log(type, message);
  }
};

export { writeInfoLog, writeErrorLog, writeConsoleLog };
