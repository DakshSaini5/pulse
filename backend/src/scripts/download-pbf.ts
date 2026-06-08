import fs from 'fs';
import path from 'path';
import axios from 'axios';

const url = 'https://download.geofabrik.de/asia/india-latest.osm.pbf';
const dest = path.join(__dirname, '../../data/india-latest.osm.pbf');

// Ensure data dir exists
const dataDir = path.dirname(dest);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function downloadWithRetry() {
  let isComplete = false;
  
  while (!isComplete) {
    let existingBytes = 0;
    if (fs.existsSync(dest)) {
      existingBytes = fs.statSync(dest).size;
    }

    if (existingBytes > 0) {
      console.log(`\nResuming download from ${existingBytes} bytes...`);
    } else {
      console.log(`\nDownloading ${url} to ${dest}...`);
      console.log('This file is ~1.6 GB, so it will take a few minutes.');
    }

    const file = fs.createWriteStream(dest, { flags: existingBytes > 0 ? 'a' : 'w' });

    try {
      await new Promise<void>((resolve, reject) => {
        axios({
          method: 'get',
          url: url,
          responseType: 'stream',
          headers: existingBytes > 0 ? { 'Range': `bytes=${existingBytes}-` } : {}
        }).then(response => {
          const isPartial = response.status === 206;
          const contentLengthStr = response.headers['content-length'];
          const incomingBytes = parseInt((typeof contentLengthStr === 'string' ? contentLengthStr : '0') || '0', 10);
          const totalBytes = isPartial ? existingBytes + incomingBytes : incomingBytes;
          
          let downloadedBytes = existingBytes;
          let lastLoggedPercent = -1;

          response.data.on('data', (chunk: any) => {
            downloadedBytes += chunk.length;
            if (totalBytes > 0) {
              const percent = Math.floor((downloadedBytes / totalBytes) * 100);
              if (percent % 5 === 0 && percent !== lastLoggedPercent) {
                console.log(`Progress: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
                lastLoggedPercent = percent;
              }
            }
          });

          response.data.on('error', (err: any) => {
            file.close();
            reject(err);
          });

          response.data.on('end', () => {
            file.close();
            if (totalBytes > 0 && downloadedBytes < totalBytes) {
              console.log('Connection dropped by server. Auto-reconnecting...');
              resolve(); // Resolve to let the while loop retry
            } else {
              isComplete = true;
              console.log('Download complete!');
              resolve();
            }
          });

          response.data.pipe(file);
        }).catch(err => {
          file.close();
          reject(err);
        });
      });
    } catch (err: any) {
      console.error('Network error. Retrying in 5 seconds...', err.message);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

downloadWithRetry();
