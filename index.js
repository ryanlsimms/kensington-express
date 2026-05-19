/**
 * Express middleware that attaches `res.renderView(pageRenderer, options)` to each response.
 *
 * @param {Function|null} defaultLayout - Layout renderer, or null/undefined for no layout.
 * @param {Function} [htmlValidator] - Optional async HTML validation function.
 *   Runs after the response is sent (fire-and-forget). Rejections are forwarded to next().
 */
function kensingtonView(defaultLayout, htmlValidator) {

  return function viewMiddleware(req, res, next) {
    res.renderView = function renderView(pageRenderer, options = {}) {
      const locals = {
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
