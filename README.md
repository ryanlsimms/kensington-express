# kensington-express

Express middleware that attaches `res.renderView()` to each response, for use with function-based (no template engine) view rendering.

## Installation

```sh
npm install kensington-express
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

app.use(kensingtonView(layout));

app.get('/', (req, res) => {
  res.renderView(homePage, { title: 'Home', items: ['foo', 'bar'] });
});
```

## API

### `kensingtonView(defaultLayout, htmlValidator?)`

Returns an Express middleware. Call once during app setup.

| Parameter | Type | Description |
|---|---|---|
| `defaultLayout` | `LayoutRenderer \| null` | Wraps every page renderer. Pass `null` to render pages without a layout. |
| `htmlValidator` | `(html: string) => void \| Promise<void>` | Called after the response is sent. Useful for dev-time HTML linting. |

### `res.renderView(pageRenderer, options?)`

Renders and sends an HTML response.

| Parameter | Type | Description |
|---|---|---|
| `pageRenderer` | `(locals) => string` | Renders the page content. |
| `options` | `object` | Merged into locals. Pass `layout` to override the default layout for this response. |

Locals available to both renderers are merged in this order (later values win):

1. `req.route`
2. `app.locals`
3. `res.locals`
4. `options` passed to `renderView`

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

Pass a `htmlValidator` function to report markup issues during development. It runs after the response is sent so it never blocks the client:

```js
import { HtmlValidate } from 'html-validate';

const htmlvalidate = new HtmlValidate();

async function htmlValidator(html) {
  const report = await htmlvalidate.validateString(html);
  if (!report.valid) console.warn(report.results);
}

app.use(kensingtonView(layout, process.env.NODE_ENV !== 'production' ? htmlValidator : undefined));
```
