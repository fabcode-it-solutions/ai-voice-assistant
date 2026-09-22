import log from "loglevel";

log.setLevel(process.env.NODE_ENV === "production" ? "error" : "debug");

export default {
  info: (message: string, meta?: any) => log.info(message, meta),
  error: (message: string, meta?: any) => log.error(message, meta),
  debug: (message: string, meta?: any) => log.debug(message, meta),
};
