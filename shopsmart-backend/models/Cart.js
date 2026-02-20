const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product', // Reference to the Product model
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Reference to the User model
    required: true,
    unique: true // A user can only have one cart
  },
  items: [CartItemSchema], // Array of products in the cart
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('cart', CartSchema);