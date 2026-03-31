import type { NextFunction, Request, RequestHandler, Response } from "express";

type SyncRouteHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export const syncHandler = (handler: SyncRouteHandler): RequestHandler => {
  return (req, res, next) => {
    try {
      const result = handler(req, res, next);
      if (result && typeof (result as Promise<void>).then === "function") {
        (result as Promise<void>).catch(next);
      }
    } catch (error) {
      next(error);
    }
  };
};
