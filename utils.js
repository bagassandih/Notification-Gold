const fs = require('fs');
const fetch = require('node-fetch');
const QuickChart = require('quickchart-js');
const dotenv = require('dotenv');
dotenv.config();

const filePath = 'data_price.txt';

async function getPriceGold(){
  const goldPrice = await fetch(process.env.API_METAL_PRICE)
  .then((res) => res.json())
  .then((result) =>  result)

  // dummy data
  // const goldPrice = {
  //   success: true,
  //   base: 'USD',
  //   timestamp: 1692237861,
  //   rates: { EUR: 0.92020859, XAG: 0.04452074, XAU: 0.00059222 }
  // }

  // Setup Object for save to price today
  let savePriceToday = goldPrice.rates;

  // Setting time stamp
  const todayStampDate = new Date();
  const todayFixDate = todayStampDate.toLocaleDateString('id-ID');
  
  // add properties/keys 
  savePriceToday['DATE'] = todayFixDate;
  savePriceToday['TIMESTAMP'] = todayStampDate;

  // get existing data
  let currentData;

  // for save after merge from current data
  let setData;

  // assign current data from database txt
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    currentData = JSON.parse(data);
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  }
  
  // check if last data is different month with today date
  if (currentData.length){
    let checkDate = new Date(currentData[currentData.length-1].TIMESTAMP);
    if (checkDate.getMonth() !== todayStampDate.getMonth()){
      // send email and reset data
      await notification();
      currentData = [];
    }
  }
  
  // set the data to object
  setData = currentData;
  setData.push(savePriceToday);

  // set the object to database txt
  try {
    const data = JSON.stringify(setData);
    fs.writeFileSync(filePath, data);
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
  
  return goldPrice
}

// notification function
async function notification(){
  let currentData;
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    currentData = JSON.parse(data)
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  }

  let getLabel = [];
  let getDataGold = [];

  for (const eachData of currentData){
    getLabel.push(eachData.DATE);
    getDataGold.push(eachData.XAU);
  }

  let Indicate = {
    neutral: 0,
    down: 0,
    up: 0, 
  };

  let month = currentData[currentData.length-1].TIMESTAMP;
  month = new Date(month).getMonth();

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
  notification
}


 

 