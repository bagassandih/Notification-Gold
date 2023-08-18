const fetch = require('node-fetch');
const QuickChart = require('quickchart-js');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const priceModel = require('./price.model');
dotenv.config();

async function connectDB(){
  const serverUrl = process.env.DB_URL;
  const database = process.env.DB_NAME;
  const dbAtlas = process.env.DB_ATLAS;

  try {
    // await mongoose.connect(`${serverUrl}/${database}`);
    await mongoose.connect(`${dbAtlas}`);
    console.log(`🚀 terhubung ke database ${database}: atlas`);
  } catch (err) {
    console.log('Gagal terhubung ke database', err);
  }
}

async function getPriceGold(){
  const goldPrice = await fetch(process.env.API_METAL_PRICE)
  .then((res) => res.json())
  .then((result) =>  result)

  // // dummy data
  // const goldPrice = {
  //   success: true,
  //   base: 'USD',
  //   timestamp: 1692237861,
  //   rates: { EUR: 0.92020859, XAG: 0.04452074, XAU: 0.00059222 }
  // }

  const todayDate = new Date();

  let savePriceToday = {
    price: goldPrice.rates,
    date: todayDate.toLocaleDateString('id-ID'),
    time_stamp: todayDate
  };

  // get existing data
  let currentPriceData = await priceModel.find().lean().sort({ _id: 1 });

  if (currentPriceData && currentPriceData.length){
    let currentPriceDataMonth = new Date(currentPriceData[currentPriceData.length-1].createdAt).getMonth() + 1;
    let newPriceDataMonth = todayDate.getMonth() + 1;

    if (newPriceDataMonth !== currentPriceDataMonth){
      // send email and reset data
      let paramDate = new Date(currentPriceData[currentPriceData.length-1].createdAt).toLocaleDateString('id-ID');
      let index = paramDate.indexOf("/");
      paramDate = paramDate.slice(index + 1);
      await notification(paramDate);
    }
  }

  await priceModel.create(savePriceToday);  
  return goldPrice;
}

// notification function
async function notification(date){
  let currentPriceData = await priceModel.find({ date: new RegExp(date) }).lean();
  let getLabel = [];
  let getDataGold = [];

  for (const eachData of currentPriceData){
    getLabel.push(eachData.date);
    getDataGold.push(eachData.price.XAU);
  }

  let Indicate = {
    neutral: 0,
    down: 0,
    up: 0, 
  };

  let month = currentPriceData[currentPriceData.length-1].createdAt;
  month = new Date(month).getMonth() + 1;

  // setup for month
  if (month === 1) month = 'Januari';
  if (month === 2) month = 'Februari';
  if (month === 3) month = 'Maret';
  if (month === 4) month = 'April';
  if (month === 5) month = 'Mei';
  if (month === 6) month = 'Juni';
  if (month === 7) month = 'Juli';
  if (month === 8) month = 'Agustus';
  if (month === 9) month = 'September';
  if (month === 10) month = 'Oktober';
  if (month === 11) month = 'November';
  if (month === 12) month = 'Desember';

  // setup for trend
  for (let i = 0; i < getDataGold.length; i++) {
    if (getDataGold[i] === getDataGold[i - 1] ) {
      Indicate.neutral += 1;
    } 
    
    if (getDataGold[i] < getDataGold[i - 1]) {
      Indicate.down += 1;
    } 
    
    if(getDataGold[i] > getDataGold[i - 1]) {
      Indicate.up += 1;
    }
  }
  
  let getTrend = [];
  for (const eachIndicate in Indicate){
    getTrend.push(Indicate[eachIndicate])
  }
  
  let trend;
  for (const eachIndicate in Indicate){
    if (Indicate[eachIndicate] === Math.max(...getTrend)){
      trend = eachIndicate
    }
  }

  if (trend === 'up'){
    trend = 'NAIK!'
  } else if (trend === 'down'){
    trend = 'TURUN!'
  } else {
    trend = 'NETRAL!'
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
    .setWidth(800)
    .setHeight(400)
    .setBackgroundColor('transparent');

  const chartImageUrl = myChart.getUrl();

  // recipient for email
  let recipient = {
    email: 'bagassandih13@gmail.com',
    firstName: 'Bagas',
    lastName: 'Arisandi',
  }

  // setup send code to emali
  const mailjet = require('node-mailjet').connect(
    process.env.MJ_APIKEY_PUBLIC, 
    process.env.MJ_APIKEY_PRIVATE
    )

  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: 'bagassandi13@gmail.com',
          Name: 'Notification GOLD',
        },
        To: [
          {
            Email: recipient.email,
            Name: recipient.fullName,
          },
        ],
        Subject: `Laporan harga Emas pada bulan ${month}`,
        TextPart: `Laporan harga Emas pada bulan ${month}`,
        HTMLPart: `<h4>Halo ${recipient.firstName}!</h4>
        <p>
            Berikut ini adalah chart harga dari <b>XAUUSD</b> kurang lebih pada bulan ${month}:
        </p>
        <img src = '${chartImageUrl}'>
        <p>Berdasarkan chart tersebut, menandakan XAUUSD dalam posisi <b>${trend}</b><p>
        <p>
            Terimakasih,
            <br>
            <br>
            Notifikasi GOLD.v1
        </p>`
      },
    ],
  })
  request
    .then(result => {
      console.log(`Laporan terikim ke ${recipient.email}`)
    })
    .catch(err => {
      console.log(err.statusCode)
    })
}

module.exports = {
  getPriceGold,
  notification,
  connectDB
}


 

 