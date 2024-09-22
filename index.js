const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const urls = [
  'https://fascia-backend.onrender.com',
  'https://ihhplayer-express-s1gr.onrender.com',
];

const lastPings = [];

const pingWithRetry = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url);
      const html = response.data;
      const match = html.match(/<title>(.*?)<\/title>/);
      const title = match ? match[1] : 'No title found';
      const date = new Date();
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      
      lastPings.unshift({
        url,
        title,
        date: dateStr,
        time: timeStr,
      });
      
      if (lastPings.length > 5) {
        lastPings.pop();
      }
      
      console.log(`Pinged ${url}: ${title}`);
      return;
    } catch (error) {
      if (error.response && error.response.status === 503) {
        console.log(`Service unavailable (503) on ${url}, retrying... (${i + 1}/${retries})`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } else {
        console.error(`Error pinging ${url}:`, error.message);
        break;
      }
    }
  }
};

const pingEndpoints = async () => {
  await pingWithRetry('https://fascia-backend.onrender.com');
  await pingWithRetry('https://ihhplayer-express-s1gr.onrender.com');
};

setInterval(pingEndpoints, 15000);

app.get('/', (req, res) => {
  if (lastPings.length === 0) {
    return res.send('<p>No pings have been made yet.</p>');
  }

  let tableContent = lastPings.map(ping => `
    <tr>
      <td>${ping.url}</td>
      <td>${ping.title}</td>
      <td>${ping.date}</td>
      <td>${ping.time}</td>
    </tr>
  `).join('');

  res.send(`
    <style>
      body {
        font-family: monospace;
        background-color: #2c2f33;
        color: #fff;
        text-align: center;
        margin: 0;
        padding: 0;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      table {
        width: 80%;
        border-collapse: collapse;
        margin: 20px auto;
        background-color: #23272a;
        border: 2px solid #7289da;
      }
      th, td {
        padding: 15px;
        text-align: left;
        border-bottom: 1px solid #7289da;
      }
      th {
        background-color: #7289da;
      }
      tr:nth-child(even) {
        background-color: #2c2f33;
      }
      tr:nth-child(odd) {
        background-color: #23272a;
      }
    </style>

    <h1>Last 5 Pings</h1>
    <table>
      <tr>
        <th>URL</th>
        <th>Title</th>
        <th>Date</th>
        <th>Time</th>
      </tr>
      ${tableContent}
    </table>
  `);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});