const http = require('http');
const https = require('https');

const token = process.env.TELEGRAM_BOT_TOKEN;
const port = Number(process.env.TRAINING_PROXY_PORT || 8787);

if (!token) {
  console.error('FEHLT: Umgebungsvariable TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer(function (req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/send') {
    res.statusCode = 404;
    res.end();
    return;
  }

  var body = '';
  req.on('data', function (chunk) {
    body += chunk;
  });
  req.on('end', function () {
    setCors(res);
    try {
      var j = JSON.parse(body || '{}');
      var payload = JSON.stringify({
        chat_id: j.chat_id,
        text: j.text
      });
      var opts = {
        hostname: 'api.telegram.org',
        path: '/bot' + token + '/sendMessage',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };
      var tgReq = https.request(opts, function (tgRes) {
        res.statusCode = tgRes.statusCode || 502;
        tgRes.pipe(res);
      });
      tgReq.on('error', function (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, description: String(err.message) }));
      });
      tgReq.write(payload);
      tgReq.end();
    } catch (e) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(String(e.message));
    }
  });
});

server.listen(port, function () {
  console.log('Training-Telegram-Proxy: POST http://127.0.0.1:' + port + '/send');
});
