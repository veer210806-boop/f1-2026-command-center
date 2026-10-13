const https = require('https');
const fs = require('fs');

const url = "https://media.formula1.com/image/upload/c_thumb,g_face,w_100,h_100/q_auto/v1740000001/common/f1/2026/ferrari/chalec01/2026ferrarichalec01right.webp";
const dest = "c:/Users/VEER/Desktop/F1/gp-command/client/public/test_face.webp";

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  const file = fs.createWriteStream(dest);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Saved test face, size:', fs.statSync(dest).size);
  });
});

