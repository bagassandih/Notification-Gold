const express = require('express');
const cron = require('node-cron');
const path = require('path');
const utilities = require('./utils');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT;

app.post('/updatePriceData', async(req, res, next) => {
  await utilities.getPriceGold();
  console.log('Data berhasil di update.');
  res.send('Data Terupdate');
});

cron.schedule('30 15 * * *', async () => {
  await utilities.getPriceGold();
  console.log('Data berhasil di update.');
});

utilities.connectDB();
  
app.listen(port, () => {
  console.log(`🚀 Server berjalan di port:${port}`);
});
