const express = require('express');
const cron = require('node-cron');

const app = express();
const port = 3000;
const utilities = require('./utils');

cron.schedule('0 7 * * *', async () => {
  await utilities.getPriceGold();
  console.log('Data berhasil di update.');
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
