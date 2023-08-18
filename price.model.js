const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const price = new Schema(
  {
    price: {
      EUR: Number,
      XAG: Number,
      XAU: Number,
    },
    date: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('price', price);
