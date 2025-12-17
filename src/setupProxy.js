const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // FIX: Only proxy API requests, not static assets
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'https://lms-backend-724799456037.europe-west1.run.app',
      changeOrigin: true,
      secure: false,
      timeout: 30000,
      proxyTimeout: 30000,
      // FIX: Reduce logging to prevent console spam
      logLevel: 'warn',
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Proxy error', 
            message: err.message 
          });
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // Only add CORS headers for API responses
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      }
    })
  );
};
