const https = require('https');

const drivers = ['lewham01', 'maxver01', 'lannor01', 'fracol01', 'arvlin01', 'olibea01'];
const teams = ['ferrari', 'redbullracing', 'mclaren', 'alpine', 'racingbulls', 'haasf1team'];

drivers.forEach((d, i) => {
  const team = teams[i];
  const url = `https://media.formula1.com/image/upload/c_thumb,g_face,w_120,h_120/q_auto/v1740000001/common/f1/2026/${team}/${d}/2026${team}${d}right.webp`;
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    console.log(`${d}: ${res.statusCode}`);
  });
});

