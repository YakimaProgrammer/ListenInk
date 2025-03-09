const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Bypass hot-update files
    app.use((req, res, next) => {
        if (req.url.includes('hot-update')) {
            return next();
        }
        return createProxyMiddleware({
            target: 'http://localhost:8080',
            changeOrigin: true,
            logLevel: 'debug',
        })(req, res, next);
    });
};
