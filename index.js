/**
 * Express middleware that attaches `res.renderView(pageRenderer, options)` to each response.
 *
 * @param {{ defaultLayout?: Function, htmlValidator?: Function, buildLocals?: Function }} [options]
 * @param {Function} [options.defaultLayout] - Layout renderer. Omit for no layout.
 * @param {Function} [options.htmlValidator] - Async HTML validation function.
 *   Runs after the response is sent (fire-and-forget). Failures are logged with
 *   console.error once headers are sent, and forwarded to next() otherwise.
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
          html = pageRenderer.call(res, locals).toString();
        }
      } catch (err) {
        return next(err);
      }

      res.send(html);

      if (typeof htmlValidator === 'function') {
        // The response is already sent, so an error can't be rendered as one:
        // forwarding to next() would reach an error handler that tries to send
        // again, or Express's default handler, which destroys the socket.
        function reportValidatorError(err) {
          if (res.headersSent) {
            console.error('[kensington-express] htmlValidator failed:', err);
          } else {
            next(err);
          }
        }
        try {
          Promise.resolve(htmlValidator(html)).catch(reportValidatorError);
        } catch (err) {
          reportValidatorError(err);
        }
      }
    };

    next();
  };
}

export default kensingtonView;
