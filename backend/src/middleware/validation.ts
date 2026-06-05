import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Validation middleware factory
 * Validates request body against a Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues.map((err: any) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }

      next(error);
    }
  };
};

/**
 * Validation middleware factory
 * Validates request query against a Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues.map((err: any) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }

      next(error);
    }
  };
};

/**
 * Validation middleware factory
 * Validates request params against a Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues.map((err: any) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }

      next(error);
    }
  };
};
