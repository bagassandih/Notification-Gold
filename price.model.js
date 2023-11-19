const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const price = new Schema(
  {
    price: Number,
    sell: Number,
    buy: Number,
    month: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('price', price);
