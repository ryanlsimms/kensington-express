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

export default function kensingtonView(
  defaultLayout: LayoutRenderer | null | undefined,
  htmlValidator?: (html: string) => void | Promise<void>,
): RequestHandler;
