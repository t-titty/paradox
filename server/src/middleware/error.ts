import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../env.js";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "validation_error", issues: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code ?? "error", message: err.message });
    return;
  }
  if (env.NODE_ENV !== "production") console.error("[paradox] unhandled", err);
  res.status(500).json({ error: "internal_error" });
};
