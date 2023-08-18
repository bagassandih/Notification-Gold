const express = require('express');
const cron = require('node-cron');
const path = require('path');

const app = express();
const port = 3000;
const utilities = require('./utils');

app.post('/updatePriceData', async (req, res, next) => {
  await utilities.getPriceGold();
  res.sendFile('Data Updated.');
});

app.post('/showData', (req, res, next) => {
  const filePath = path.join(__dirname, './data_price.txt'); // Ganti dengan nama file Anda
  res.setHeader('Content-Type', 'text/plain'); // Set tipe konten ke text/plain
  res.sendFile(filePath);
});

cron.schedule('30 10 * * *', async () => {
  await utilities.getPriceGold();
  console.log('Data berhasil di update.');
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
