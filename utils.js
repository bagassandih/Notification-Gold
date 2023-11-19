const fetch = require('node-fetch');
const QuickChart = require('quickchart-js');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const PriceModel = require('./price.model');
const TelegramBot = require('telegrambot');
const moment = require('moment');
dotenv.config();

async function connectDB() {
  const serverUrl = process.env.DB_URL;
  const database = process.env.DB_NAME;
  const dbAtlas = process.env.DB_ATLAS;
  try {
    await mongoose.connect(`${serverUrl}/${database}`);
    // await mongoose.connect(`${dbAtlas}`);
    console.log(`🚀 terhubung ke database ${database}: atlas`);
  } catch (err) {
    console.log('Gagal terhubung ke database', err);
  }
}

async function getPriceGold() {
  const goldPrice = await fetch(process.env.API_PLUANG);
  const response = await goldPrice.json();
  const data = response.data.current;

  const todayDate = moment();
  // const todayDate = moment('2023-10-18T00:38:42+07:00');

  const objToSave = {
    price: data.midPrice,
    sell: data.sell,
    buy: data.buy,
    month: todayDate.format('MMMM')
  }

  await PriceModel.create(objToSave);

  let lastData = await PriceModel.find({}).sort({ _id: -1 }).lean();
  lastData = lastData[0];

  const dateLastData = moment(lastData.CreatedAt);
  if (todayDate.month() + 1 !== dateLastData.month() + 1) {
    await sentToTelegram(lastData.month);
  }

}

async function generateData() {
  const goldPrice = await fetch(process.env.API_PLUANG);
  const response = await goldPrice.json();
  const data = response.data.current;

  for (let i = 10; i <= 20; i++) {
    const todayDate = moment(`2023-10-${i}T00:38:42+07:00`);

    const objToSave = {
      price: data.midPrice,
      sell: data.sell,
      buy: data.buy,
      month: todayDate.format('MMMM'),
    };

    await PriceModel.create(objToSave);
    console.log('data created', i);
  }
}

// notification function
async function sentToTelegram(month) {
  let currentPriceData = await PriceModel.find({ month }).lean();
  let getLabel = [];
  let getDataGold = [];

  for (const eachData of currentPriceData) {
    getLabel.push(translate(moment(eachData.createdAt).format('dddd')) + ' ' + moment(eachData.createdAt).format('DD/MM/YYYY'));
    getDataGold.push(eachData.price);
  }

  let Indicate = {
    neutral: 0,
    down: 0,
    up: 0,
  };

  // setup for trend
  for (let i = 0; i < getDataGold.length; i++) {
    if (getDataGold[i] === getDataGold[i - 1]) {
      Indicate.neutral += 1;
    }

    if (getDataGold[i] < getDataGold[i - 1]) {
      Indicate.down += 1;
    }

    if (getDataGold[i] > getDataGold[i - 1]) {
      Indicate.up += 1;
    }
  }

  let getTrend = [];
  for (const eachIndicate in Indicate) {
    getTrend.push(Indicate[eachIndicate]);
  }

  let trend;
  for (const eachIndicate in Indicate) {
    if (Indicate[eachIndicate] === Math.max(...getTrend)) {
      trend = eachIndicate;
    }
  }

  if (trend === 'up') {
    trend = 'NAIK!';
  } else if (trend === 'down') {
    trend = 'TURUN!';
  } else {
    trend = 'NETRAL!';
  }

  // line chart
  const myChart = new QuickChart();
  myChart
    .setConfig({
      type: 'line',
      data: {
        labels: getLabel,
        datasets: [
          {
            label: 'GOLD',
            data: getDataGold,
            fill: false,
            borderColor: 'orange',
          },
        ],
      },
    })
    .setWidth(1000)
    .setHeight(500)
    .setBackgroundColor('transparent');

  const chartImageUrl = myChart.getUrl();

  // recipient for email
  let recipient = {
    email: 'bagassandih13@gmail.com',
    firstName: 'Bagas',
    lastName: 'Arisandi',
  };

  let msg1 = `Halo ${recipient.firstName}! \n\n`;
  msg1 += `Berikut ini adalah chart harga dari <b>Emas</b> kurang lebih pada bulan ${month}:`;

  let msg2 = `Berdasarkan chart tersebut, menandakan Emas dalam posisi <b>${trend}</b>! \n\n`;
  msg2 += `Terimakasih`;

  setTimeout(() => sender(msg1, 'text'), 1000);
  setTimeout(() => sender(chartImageUrl, 'photo'), 2000);
  setTimeout(() => sender(msg2, 'text'), 3000);
}

function translate(string) {
  const hari = {
    Sunday: {
      indonesian: 'Minggu',
    },
    Monday: {
      indonesian: 'Senin',
    },
    Tuesday: {
      indonesian: 'Selasa',
    },
    Wednesday: {
      indonesian: 'Rabu',
    },
    Thursday: {
      indonesian: 'Kamis',
    },
    Friday: {
      indonesian: 'Jumat',
    },
    Saturday: {
      indonesian: 'Sabtu',
    },
  };

  return hari[string].indonesian;
}

function sender(content, type) {
  const chat_id = 1342533134;
  const tele = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

  if (type === 'text') {
    tele.sendMessage({ chat_id, text: content, parse_mode: 'HTML' }, function (err, message) {
      if (err) throw new Error(err);
    });
  } else if (type === 'photo') {
    tele.sendPhoto({ chat_id, photo: content }, function (err, message) {
      if (err) throw new Error(err);
    });
  }

  return 'OK';
}

module.exports = {
  getPriceGold,
  generateData,
  connectDB,
};
