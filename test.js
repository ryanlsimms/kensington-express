import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

import kensingtonView from './index.js';

function makeReq(overrides = {}) {
  return {
    route: null,
    app: { locals: {} },
    ...overrides,
  };
}

function makeRes(overrides = {}) {
  return {
    locals: {},
    send: mock.fn(),
    ...overrides,
  };
}

function setup(defaultLayout, htmlValidator) {
  const middleware = kensingtonView({ defaultLayout, htmlValidator });
  const req = makeReq();
  const res = makeRes();
  const next = mock.fn();
  middleware(req, res, next);
  return { req, res, next };
}

// ─── middleware ─────────────────────────────────────────────────────────────

describe('kensingtonView', () => {
  it('attaches renderView to res and calls next', () => {
    const { res, next } = setup(null);
    assert.equal(typeof res.renderView, 'function');
    assert.equal(next.mock.calls.length, 1);
  });
});

// ─── res.renderView ─────────────────────────────────────────────────────────

describe('res.renderView', () => {
  it('renders page without layout when defaultLayout is omitted', () => {
    const { res } = setup(null);
    res.renderView(() => '<p>hello</p>');
    assert.equal(res.send.mock.calls[0].arguments[0], '<p>hello</p>');
  });

  it('renders page inside default layout', () => {
    const layout = (locals, page) => `<html>${page(locals)}</html>`;
    const { res } = setup(layout);
    res.renderView(() => '<p>hello</p>');
    assert.equal(res.send.mock.calls[0].arguments[0], '<html><p>hello</p></html>');
  });

  it('overrides layout per-render', () => {
    const defaultLayout = (locals, page) => `<default>${page(locals)}</default>`;
    const altLayout = (locals, page) => `<alt>${page(locals)}</alt>`;
    const { res } = setup(defaultLayout);
    res.renderView(() => '<p>hello</p>', { layout: altLayout });
    assert.equal(res.send.mock.calls[0].arguments[0], '<alt><p>hello</p></alt>');
  });

  it('skips layout when options.layout is null', () => {
    const layout = (locals, page) => `<html>${page(locals)}</html>`;
    const { res } = setup(layout);
    res.renderView(() => '<p>hello</p>', { layout: null });
    assert.equal(res.send.mock.calls[0].arguments[0], '<p>hello</p>');
  });

  it('merges locals with correct priority: app < res < options', () => {
    const middleware = kensingtonView();
    const req = makeReq({ app: { locals: { a: 'app', b: 'app' } } });
    const res = makeRes({ locals: { b: 'res', c: 'res' } });
    const next = mock.fn();
    middleware(req, res, next);

    let captured;
    res.renderView((locals) => { captured = locals; return ''; }, { c: 'options', d: 'options' });

    assert.equal(captured.a, 'app');
    assert.equal(captured.b, 'res');
    assert.equal(captured.c, 'options');
    assert.equal(captured.d, 'options');
  });

  it('includes req.route in locals', () => {
    const route = { path: '/test' };
    const middleware = kensingtonView();
    const req = makeReq({ route });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    let captured;
    res.renderView((locals) => { captured = locals; return ''; });
    assert.equal(captured.route, route);
  });

  it('uses buildLocals to construct locals when provided', () => {
    const buildLocals = (req, res, options) => ({
      flash: req.session?.flash,
      req,
      ...options,
    });
    const middleware = kensingtonView({ buildLocals });
    const req = makeReq({ session: { flash: ['saved!'] } });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    let captured;
    res.renderView((locals) => { captured = locals; return ''; }, { foo: 'bar' });

    assert.deepEqual(captured.flash, ['saved!']);
    assert.equal(captured.req, req);
    assert.equal(captured.foo, 'bar');
    assert.equal(captured.route, undefined);
  });

  it('forwards render errors to next', () => {
    const err = new Error('render failed');
    const { res, next } = setup(null);
    res.renderView(() => { throw err; });
    assert.equal(next.mock.calls.at(-1).arguments[0], err);
  });

  it('forwards layout errors to next', () => {
    const err = new Error('layout failed');
    const layout = () => { throw err; };
    const { res, next } = setup(layout);
    res.renderView(() => '<p>hello</p>');
    assert.equal(next.mock.calls.at(-1).arguments[0], err);
  });
});

// ─── htmlValidator ──────────────────────────────────────────────────────────

describe('htmlValidator', () => {
  it('is called with rendered html after send', async () => {
    const validator = mock.fn(async () => {});
    const { res } = setup(null, validator);
    res.renderView(() => '<p>hello</p>');

    assert.equal(res.send.mock.calls.length, 1);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(validator.mock.calls.length, 1);
    assert.equal(validator.mock.calls[0].arguments[0], '<p>hello</p>');
  });

  it('forwards validator rejections to next', async () => {
    const err = new Error('validation failed');
    const validator = mock.fn(async () => { throw err; });
    const { res, next } = setup(null, validator);
    res.renderView(() => '<p>hello</p>');

    await new Promise(resolve => setImmediate(resolve));
    assert.equal(next.mock.calls.at(-1).arguments[0], err);
  });

  it('send is not blocked by validator', async () => {
    let resolveValidator;
    const validator = mock.fn(() => new Promise(resolve => { resolveValidator = resolve; }));
    const { res } = setup(null, validator);
    res.renderView(() => '<p>hello</p>');

    assert.equal(res.send.mock.calls.length, 1);
    resolveValidator();
  });
});
