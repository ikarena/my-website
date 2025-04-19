const video = document.getElementById('video');
const result = document.getElementById('result');

// クライアント側セッションIDをCookieで管理
function getSessionId() {
  const cookie = document.cookie.split('; ').find(row => row.startsWith('sessionId='));
  if (cookie) return cookie.split('=')[1];
  const id = crypto.randomUUID();
  document.cookie = `sessionId=${id}; path=/`;
  return id;
}
const sessionId = getSessionId();

navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    setInterval(() => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/jpeg');
      const userAgent = navigator.userAgent;

      fetch('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataURL,
          userAgent: userAgent,
          sessionId: sessionId
        })
      })
      .then(res => res.json())
      .then(data => {
        result.textContent = `診断結果：あなたは「${data.name}」に似ています！`;
      })
      .catch(err => {
        result.textContent = '診断に失敗しました。';
        console.error(err);
      });
    }, 1000);
  })
  .catch(err => {
    alert('カメラの使用が拒否されました: ' + err);
  });
