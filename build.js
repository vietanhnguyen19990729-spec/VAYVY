/* build.js — ghép _template.html + assets/ thành index.html
 *
 *   node build.js
 *
 * Luôn sửa _template.html rồi chạy lệnh trên. KHÔNG sửa tay index.html:
 * nó là file kết quả, sửa tay là lần build sau mất sạch.
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const A = f => path.join(DIR, 'assets', f);
const b64 = f => fs.readFileSync(A(f)).toString('base64');

const meta = JSON.parse(fs.readFileSync(A('meta.json'), 'utf8'));
let html = fs.readFileSync(path.join(DIR, '_template.html'), 'utf8');

const FILL = {
  __PORTRAIT_B64__: 'data:image/jpeg;base64,' + b64('portrait.jpg'),
  __AUDIO_B64__:    'data:audio/mpeg;base64,' + b64('bgm.mp3'),
  __STARMAP_B64__:  b64('starmap.bin'),
  __ASPECT__:       String(meta.aspect),
  __STRIDE__:       String(meta.stride || 6)
};

for (const [key, val] of Object.entries(FILL)) {
  if (!html.includes(key)) {
    console.error('LOI: khong thay cho trong ' + key + ' trong _template.html');
    process.exit(1);
  }
  html = html.split(key).join(val);   // split/join: khong dinh ky tu dac biet cua regex
}

const left = html.match(/__[A-Z0-9_]+__/g);
if (left) {
  console.error('LOI: con cho trong chua duoc thay: ' + [...new Set(left)].join(', '));
  process.exit(1);
}

fs.writeFileSync(path.join(DIR, 'index.html'), html);

const mb = n => (n / 1048576).toFixed(2) + ' MB';
console.log('index.html   ' + mb(Buffer.byteLength(html)) + '   (' + html.split('\n').length + ' dong)');
console.log('  chan dung  ' + mb(fs.statSync(A('portrait.jpg')).size));
console.log('  nhac       ' + mb(fs.statSync(A('bgm.mp3')).size));
console.log('  ban do sao ' + mb(fs.statSync(A('starmap.bin')).size) + '   (' + meta.stars.toLocaleString('vi-VN') + ' ngoi sao)');
