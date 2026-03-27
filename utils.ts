import type { NextFunction, Request, RequestHandler, Response } from "express";

type SyncRouteHandler = (req: Request, res: Response, next: NextFunction) => void;

export const syncHandler = (handler: SyncRouteHandler): RequestHandler => {
  return (req, res, next) => {
    try {
      handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
