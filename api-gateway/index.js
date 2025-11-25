require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Service URLs
const services = {
  users: process.env.USERS_SERVICE_URL || 'https://users.inf326.nursoft.dev',
  channels: process.env.CHANNELS_SERVICE_URL || 'https://channel-api.inf326.nur.dev',
  threads: process.env.THREADS_SERVICE_URL || 'https://threads.inf326.nursoft.dev',
  messages: process.env.MESSAGES_SERVICE_URL || 'https://messages-service.kroder.dev',
  files: process.env.FILES_SERVICE_URL || 'http://file-service-134-199-176-197.nip.io',
  moderation: process.env.MODERATION_SERVICE_URL || 'https://moderation.inf326.nur.dev',
  presence: process.env.PRESENCE_SERVICE_URL || 'https://presence-134-199-176-197.nip.io',
  search: process.env.SEARCH_SERVICE_URL || 'https://searchservice.inf326.nursoft.dev',
  wikiBot: process.env.WIKI_BOT_SERVICE_URL || 'http://wikipedia-chatbot-134-199-176-197.nip.io',
  progBot: process.env.PROG_BOT_SERVICE_URL || 'https://chatbotprogra.inf326.nursoft.dev',
};

const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  followRedirects: false, // No seguir redirects automáticamente
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.path} -> ${target}`);
    // Ensure Authorization header is logged for debugging
    if (req.headers.authorization) {
       console.log(`[Proxy] Auth: ${req.headers.authorization.substring(0, 10)}...`);
    } else {
       console.log(`[Proxy] No Authorization Header`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Proxy] Response from ${target}: ${proxyRes.statusCode} ${req.path}`);
    
    // Rewrite Location headers to point back to Gateway for redirects
    if (proxyRes.headers['location']) {
      const oldLocation = proxyRes.headers['location'];
      try {
        const locationUrl = new URL(oldLocation);
        const targetUrl = new URL(target);
        
        // Check if redirect is from the target service
        if (locationUrl.hostname === targetUrl.hostname) {
           locationUrl.protocol = req.protocol + ':'; // Use gateway protocol
           locationUrl.host = req.headers.host;       // Use gateway host
           const newLocation = locationUrl.toString();
           proxyRes.headers['location'] = newLocation;
           console.log(`[Proxy] Rewrote Location: ${oldLocation} -> ${newLocation}`);
        }
      } catch (e) {
        console.error(`[Proxy] Error rewriting location: ${e.message}`);
      }
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Proxy Error', details: err.message });
  }
});

// Users Service
app.use(['/v1/users', '/v1/auth'], createProxyMiddleware(proxyOptions(services.users)));

// Channels Service
app.use(['/v1/channels', '/v1/members'], createProxyMiddleware(proxyOptions(services.channels)));

// Threads Service - Main threads endpoints
app.use('/v1/threads/threads', createProxyMiddleware({
  ...proxyOptions(services.threads),
  pathRewrite: {
    '^/v1/threads/threads': '/threads/threads'
  }
}));

// Threads Service - Channel endpoints
app.use('/v1/threads/channel', createProxyMiddleware({
  ...proxyOptions(services.threads),
  pathRewrite: {
    '^/v1/threads/channel': '/threads/channel'
  }
}));

// Threads Service - Health endpoint
app.use('/v1/threads/health', createProxyMiddleware({
  ...proxyOptions(services.threads),
  pathRewrite: {
    '^/v1/threads/health': '/threads/health'
  }
}));

// Threads Service - Admin endpoints
app.use('/v1/threads/admin', createProxyMiddleware({
  ...proxyOptions(services.threads),
  pathRewrite: {
    '^/v1/threads/admin': '/threads/admin'
  }
}));

// Threads Service - Moderation endpoints
app.use('/v1/threads/moderation', createProxyMiddleware({
  ...proxyOptions(services.threads),
  pathRewrite: {
    '^/v1/threads/moderation': '/threads/moderation'
  }
}));

// Threads Service - Message on thread endpoint
app.use('/v1/threads/message', createProxyMiddleware({
  ...proxyOptions(services.threads),
  pathRewrite: {
    '^/v1/threads/message': '/threads/message'
  }
}));

// Messages Service (Note: frontend calls /threads for messages)
app.use('/threads', createProxyMiddleware(proxyOptions(services.messages)));

// Files Service
app.use('/v1/files', createProxyMiddleware(proxyOptions(services.files)));

// Moderation Service
// Added /api/v1/ping and /api/v1/health
app.use(['/api/v1/moderation', '/api/v1/blacklist', '/api/v1/admin', '/api/v1/ping', '/api/v1/health'], createProxyMiddleware(proxyOptions(services.moderation)));

// Presence Service
app.use('/api/v1.0.0/presence', createProxyMiddleware(proxyOptions(services.presence)));

// Search Service
// Routes: /api/message, /api/files, /api/channel, /api/threads, /api/healthz, /api/livez
app.use(['/api/message', '/api/files', '/api/channel', '/api/threads', '/api/healthz', '/api/livez'], createProxyMiddleware(proxyOptions(services.search)));

// Wikipedia Chatbot
app.use('/chat-wikipedia', createProxyMiddleware(proxyOptions(services.wikiBot)));

// Programming Chatbot
app.use('/chat', createProxyMiddleware(proxyOptions(services.progBot)));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
