import type { RequestHandler, Response } from 'express';

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
    renderView(pageRenderer: PageRenderer, options?: RenderViewOptions): void;
  }
}

export type BuildLocals = (
  req: import('express').Request,
  res: import('express').Response,
  options: RenderViewOptions,
) => Record<string, unknown>;

export interface KensingtonOptions {
  defaultLayout?: LayoutRenderer | null;
  htmlValidator?: (html: string) => void | Promise<void>;
  buildLocals?: BuildLocals;
}

export default function kensingtonView(options?: KensingtonOptions): RequestHandler;
