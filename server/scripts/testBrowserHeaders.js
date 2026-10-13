const https = require('https');

const url = 'https://media.formula1.com/image/upload/c_thumb,g_face,w_120,h_120/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000001/common/f1/2026/ferrari/chalec01/2026ferrarichalec01right.webp';

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'http://localhost:5173/',
    'Origin': 'http://localhost:5173',
  }
};

https.get(url, options, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
});

