import type { NextFunction, Request, Response } from 'express';

export type PageRenderer = (locals: Record<string, unknown>) => { toString(): string };

export type LayoutRenderer = (
  this: Response,
  locals: Record<string, unknown>,
  pageRenderer: PageRenderer,
) => { toString(): string };

export interface RenderViewOptions extends Record<string, unknown> {
  layout?: LayoutRenderer | null;
}

declare module 'express-serve-static-core' {
  interface Response {
    renderView(
      pageRenderer: (locals: Record<string, unknown>) => { toString(): string },
      options?: Record<string, unknown> & {
        layout?: ((this: Response, locals: Record<string, unknown>, pageRenderer: (locals: Record<string, unknown>) => { toString(): string }) => { toString(): string }) | null;
      },
    ): void;
  }
}

export type BuildLocals = (
  req: Request,
  res: Response,
  options: RenderViewOptions,
) => Record<string, unknown>;

export interface KensingtonOptions {
  defaultLayout?: LayoutRenderer | null;
  htmlValidator?: ((html: string) => void | Promise<void>) | null;
  buildLocals?: BuildLocals;
}

export default function kensingtonView(
  options?: KensingtonOptions,
): (req: Request, res: Response, next: NextFunction) => void;
