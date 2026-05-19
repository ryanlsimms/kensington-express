/**
 * Express middleware that attaches `res.renderView(pageRenderer, options)` to each response.
 *
 * @param {{ defaultLayout?: Function, htmlValidator?: Function, buildLocals?: Function }} [options]
 * @param {Function} [options.defaultLayout] - Layout renderer. Omit for no layout.
 * @param {Function} [options.htmlValidator] - Async HTML validation function.
 *   Runs after the response is sent (fire-and-forget). Rejections are forwarded to next().
 * @param {Function} [options.buildLocals] - Custom locals builder: (req, res, options) => object.
 *   When provided, replaces the default locals merging logic entirely.
 * @returns {function(import('express').Request, import('express').Response, import('express').NextFunction): void}
 */
function kensingtonView({ defaultLayout, htmlValidator, buildLocals } = {}) {

  /** @type {import('express').RequestHandler} */
  return function viewMiddleware(req, res, next) {
    res.renderView = function renderView(pageRenderer, options = {}) {
      const locals = typeof buildLocals === 'function'
        ? buildLocals(req, res, options)
        : {
            route: req.route,
            ...req.app.locals,
            ...res.locals,
            ...options,
          };

      const layoutRenderer = Object.hasOwn(options, 'layout') ? options.layout : defaultLayout;

      let html;
      try {
        if (typeof layoutRenderer === 'function') {
          html = layoutRenderer.call(res, locals, pageRenderer.bind(res)).toString();
        } else {
          html = pageRenderer(locals).toString();
        }
      } catch (err) {
        return next(err);
      }

      res.send(html);

      if (typeof htmlValidator === 'function') {
        Promise.resolve(htmlValidator(html)).catch(next);
      }
    };

    next();
  };
}

export default kensingtonView;
