import type { RequestHandler, Response } from 'express';
import kensingtonView from 'kensington-express';
import type { PageRenderer, LayoutRenderer } from 'kensington-express';

// ─── kensingtonView factory ──────────────────────────────────────────────────

const _a: RequestHandler = kensingtonView(null);
const _b: RequestHandler = kensingtonView(undefined);

const layout: LayoutRenderer = function(locals, page) {
  return page(locals);
};
const _c: RequestHandler = kensingtonView(layout);

const _d: RequestHandler = kensingtonView(layout, async (html: string) => {
  console.log(html);
});

const _e: RequestHandler = kensingtonView(layout, (html: string) => {
  console.log(html);
});

// @ts-expect-error - htmlValidator must be a function
kensingtonView(layout, 'not a function');

// ─── res.renderView augmentation ─────────────────────────────────────────────

declare const res: Response;
declare const pageRenderer: PageRenderer;
declare const altLayout: LayoutRenderer;

res.renderView(pageRenderer);
res.renderView(pageRenderer, { layout: altLayout });
res.renderView(pageRenderer, { layout: null });
res.renderView(pageRenderer, { title: 'Home', items: ['foo', 'bar'] });

// @ts-expect-error - pageRenderer is required
res.renderView();

// @ts-expect-error - pageRenderer must be a function
res.renderView('not a function');

// ─── renderer signatures ──────────────────────────────────────────────────────

const _page: PageRenderer = (locals) => `<p>${locals['title']}</p>`;

const _layout: LayoutRenderer = function(locals, page) {
  return `<html>${page(locals)}</html>`;
};

// layout receives res as `this`
const _layoutWithThis: LayoutRenderer = function(locals, page) {
  const _self: Response = this;
  return page(locals);
};
