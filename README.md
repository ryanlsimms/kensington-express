# kensington-express

Express middleware that attaches `res.renderView()` to each response, for use with function-based (no template engine) view rendering.

## Installation

```sh
npm install express kensington kensington-express
```

## Usage

```js
// views/layout.js
import t from 'kensington';

export default function layout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' },
    t.head(
      t.title(locals.title),
    ),
    t.body(
      page(locals),
    ),
  );
}
```

```js
// views/home.js
import t from 'kensington';

export default function homePage({ title, items }) {
  return t.main(
    t.h1(title),
    t.ul(items.map(item => t.li(item))),
  );
}
```

```js
// app.js
import kensingtonView from 'kensington-express';
import layout from './views/layout.js';
import homePage from './views/home.js';

app.use(kensingtonView({ defaultLayout: layout }));

app.get('/', (req, res) => {
  res.renderView(homePage, { title: 'Home', items: ['foo', 'bar'] });
});
```

## API

### `kensingtonView(options?)`

Returns an Express middleware. Call once during app setup.

| Parameter | Type | Description |
|---|---|---|
| `options.defaultLayout` | `LayoutRenderer \| null` | Wraps every page renderer. Omit it or pass `null` to render pages without a layout. |
| `options.htmlValidator` | `(html: string) => void \| Promise<void>` | Called after the response is sent. Useful for dev-time HTML linting. |
| `options.buildLocals` | `(req, res, options) => object` | Replaces the default locals builder and returns the locals passed to both renderers. |

### `res.renderView(pageRenderer, options?)`

Renders and sends an HTML response.

| Parameter | Type | Description |
|---|---|---|
| `pageRenderer` | `(locals) => { toString(): string }` | Renders the page content. Plain strings are supported. Called with `this` set to the response. |
| `options` | `object` | Merged into locals. Pass `layout` to override the default layout for this response. |

By default, locals available to both renderers are merged in this order (later values win):

1. `req.route`
2. `app.locals`
3. `res.locals`
4. `options` passed to `renderView`

When `buildLocals` is provided, it receives `(req, res, options)` and its return value replaces this default merge.

Layouts and page renderers are both called with `this` set to the response, so a `function` renderer can read `this.req`. This also holds when `layout: null` or no `defaultLayout` is set. Arrow functions don't receive `this`; use `buildLocals` or `res.locals` to pass request data to them.

## Layouts

To use an alternate layout for a route, pass it as `layout`:

```js
// views/admin-layout.js
import t from 'kensington';

export default function adminLayout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' },
    t.head(
      t.title(locals.title),
    ),
    t.body(
      t.nav('Admin'),
      page(locals),
    ),
  );
}
```

```js
// app.js
import adminLayout from './views/admin-layout.js';

app.get('/admin', (req, res) => {
  res.renderView(adminPage, { layout: adminLayout, title: 'Admin' });
});
```

To skip the layout entirely for a route, pass `layout: null`:

```js
res.renderView(myPageRenderer, { layout: null });
```

## HTML validation

Install `html-validate` if you want to validate rendered markup during development:

```sh
npm install --save-dev html-validate
```

Pass an `htmlValidator` function to report markup issues. The response is sent before validation runs, so a validator that throws or rejects can't change the response. Once headers are sent, its error is logged with `console.error` instead of being passed to `next()`:

```js
import { HtmlValidate } from 'html-validate';

const htmlvalidate = new HtmlValidate();

async function htmlValidator(html) {
  const report = await htmlvalidate.validateString(html);
  if (!report.valid) console.warn(report.results);
}

app.use(kensingtonView({
  defaultLayout: layout,
  htmlValidator: process.env.NODE_ENV !== 'production' ? htmlValidator : undefined,
}));
```
