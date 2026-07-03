import winston, { format } from "winston";

// 建立一個統一的日誌格式
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf((info: any) => `${info.timestamp} [${info.level}] ${info.message}`),
  format.errors({ stack: true })
);

// 💡 無論什麼環境，都加上 Console 輸出，這樣 docker compose logs 才看得到！
const mainTransports: winston.transport[] = [
  new winston.transports.Console({
    format: format.combine(format.colorize(), format.simple())
  })
];

const cmsTransports: winston.transport[] = [
  new winston.transports.Console({
    format: format.combine(format.colorize(), format.simple())
  })
];

// 如果有需要，依然可以在容器內產生 log 檔案（可選）
mainTransports.push(
  new winston.transports.File({
    filename: process.env.NODE_ENV === "development" ? "my_programming_journey_dev.log" : "my_programming_journey.log",
    handleExceptions: true,
  })
);

cmsTransports.push(
  new winston.transports.File({
    filename: process.env.NODE_ENV === "development" ? "my_programming_journey_cms_dev.log" : "my_programming_journey_cms.log",
    handleExceptions: true,
  })
);

winston.loggers.add("fileLogger", {
  transports: mainTransports,
  exitOnError: false,
  format: logFormat
});

winston.loggers.add("cmsFileLogger", {
  transports: cmsTransports,
  exitOnError: false,
  format: logFormat
});

const fileLogger = winston.loggers.get("fileLogger");
const cmsFileLogger = winston.loggers.get("cmsFileLogger");

const writeInfoLog = (message: string) => {
  fileLogger.info(message);
};

const writeErrorLog = (message: string) => {
  fileLogger.error(message);
};

const cmsWriteInfoLog = (message: string) => {
  cmsFileLogger.info(message);
};

const cmsWriteErrorLog = (message: string) => {
  cmsFileLogger.error(message);
};

// 💡 修正：生產環境呼叫時，直接分流給 fileLogger (它現在會同時印在 Console)
const writeConsoleLog = (type: string, message: string) => {
  if (type === "error") {
    fileLogger.error(message);
  } else {
    fileLogger.info(message);
  }
};

export {
  writeInfoLog,
  writeErrorLog,
  cmsWriteInfoLog,
  cmsWriteErrorLog,
  writeConsoleLog,
};