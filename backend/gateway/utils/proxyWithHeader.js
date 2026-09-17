import proxy from "express-http-proxy";

export function publicProxy(serviceUrl) {
  return proxy(serviceUrl, {
    proxyReqPathResolver: (req) => req.originalUrl,

    proxyErrorHandler: (err, res) => {
      console.error("Public proxy error:", err.message);
      res.status(502).json({
        success: false,
        code: "UPSTREAM_UNAVAILABLE",
      });
    },
  });
}

export function proxyWithHeader(serviceUrl) {
  return proxy(serviceUrl, {
    proxyReqPathResolver: (req) => req.originalUrl,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // Strip client-supplied identity headers (security)
      delete proxyReqOpts.headers["x-user-id"];
      delete proxyReqOpts.headers["x-user-email"];
      delete proxyReqOpts.headers["x-user-roles"];

      // Inject from req.user (set by protect middleware)
      if (srcReq?.user?.userId) {
        proxyReqOpts.headers["x-user-id"] = String(srcReq.user.userId);
      }
      if (srcReq?.user?.email) {
        proxyReqOpts.headers["x-user-email"] = srcReq.user.email;
      }
      if (Array.isArray(srcReq?.user?.roles)) {
        proxyReqOpts.headers["x-user-roles"] = srcReq.user.roles.join(",");
      }

      return proxyReqOpts;
    },

    proxyErrorHandler: (err, res) => {
      console.error("Proxy error:", err.message);
      res.status(502).json({
        success: false,
        code: "UPSTREAM_UNAVAILABLE",
      });
    },
  });
}