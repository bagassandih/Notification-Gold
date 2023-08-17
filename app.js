const express = require('express');
const cron = require('node-cron');
const path = require('path');

const app = express();
const port = 3000;
const utilities = require('./utils');

app.use('/', (req, res, next) => {
  const filePath = path.join(__dirname, './data_price.txt'); // Ganti dengan nama file Anda
  res.setHeader('Content-Type', 'text/plain'); // Set tipe konten ke text/plain
  res.sendFile(filePath);
});

cron.schedule('0 7 * * *', async () => {
  await utilities.getPriceGold();
  console.log('Data berhasil di update.');
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
