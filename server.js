const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Browser instance cache
let browser;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });
  }
  return browser;
}

// OG Image generation endpoint
app.get('/og-image', async (req, res) => {
  try {
    const {
      title = 'تجربة من كتاب النور',
      voice = 'مجهول',
      date = '2024',
      content = 'تجربة حقيقية من الحياة'
    } = req.query;

    const html = generateHTML(title, voice, date, content);
    
    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();
    
    await page.setViewport({ width: 1200, height: 630 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false
    });
    
    await page.close();
    
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400'
    });
    
    res.send(screenshot);
    
  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'annur-og-generator' });
});

function generateHTML(title, voice, date, content) {
  // Truncate content for preview
  const contentPreview = content.substring(0, 120) + '...';
  
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #f8f5f0 0%, #f2ede4 50%, #ede8dd 100%);
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      position: relative;
      overflow: hidden;
    }
    
    /* Large background logo watermark */
    .background-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 400px;
      background: url('https://annur.ai/images/annur-ai.png') no-repeat center;
      background-size: contain;
      opacity: 0.05;
      z-index: 1;
    }
    
    /* Content overlay with gradient */
    .content-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(248, 245, 240, 0.3) 30%,
        rgba(255, 255, 255, 0.2) 70%,
        rgba(248, 245, 240, 0.1) 100%
      );
      z-index: 2;
    }
    
    /* Main container */
    .container {
      position: relative;
      z-index: 3;
      width: 100%;
      height: 100%;
      padding: 60px;
      display: flex;
      flex-direction: column;
    }
    
    /* Voice name and date - top right */
    .author-info {
      text-align: right;
      margin-bottom: 80px;
      font-size: 28px;
      font-weight: 600;
      color: #2c1810;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    }
    
    /* Main title - center */
    .title {
      text-align: center;
      font-size: 64px;
      font-weight: 700;
      color: #1a0f08;
      line-height: 1.1;
      margin-bottom: 40px;
      text-shadow: 0 2px 4px rgba(255, 255, 255, 0.9);
      max-width: 900px;
      align-self: center;
    }
    
    /* Content snippet */
    .content-snippet {
      text-align: center;
      font-size: 24px;
      font-weight: 400;
      color: #4a3428;
      line-height: 1.4;
      max-width: 800px;
      align-self: center;
      opacity: 0.9;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
    }
    
    /* Elegant borders */
    .border {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 3px solid #dcc896;
      border-radius: 15px;
      z-index: 4;
    }
    
    /* Inner border for depth */
    .inner-border {
      position: absolute;
      top: 35px;
      left: 35px;
      right: 35px;
      bottom: 35px;
      border: 1px solid rgba(220, 200, 150, 0.4);
      border-radius: 10px;
      z-index: 4;
    }
  </style>
</head>
<body>
  <div class="background-logo"></div>
  <div class="content-overlay"></div>
  <div class="border"></div>
  <div class="inner-border"></div>
  
  <div class="container">
    <div class="author-info">
      ${voice} ${date}
    </div>
    
    <div class="title">
      ${title}
    </div>
    
    <div class="content-snippet">
      ${contentPreview}
    </div>
  </div>
</body>
</html>`;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Annur OG Generator running on port ${PORT}`);
});

module.exports = app;