// shopsmart-backend/db.js

const mongoose = require('mongoose');
const dotenv = require('dotenv'); // <-- ADD THIS LINE

// Load env vars (this must be done before using process.env)
// It will look for .env in the root of your backend project
dotenv.config({ path: './.env' }); // <-- ADD THIS LINE

// Now, get the MONGO_URI from process.env
const db = process.env.MONGO_URI; // <-- CHANGE THIS LINE

const connectDB = async () => {
  try {
    // Add console.log to confirm the URI is being picked up
    console.log('--- DB CONNECTION STARTUP ENV CHECK ---');
    console.log('Attempting to connect with MONGO_URI:', db); // Using 'db' variable here
    console.log('--------------------------------');

    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true
      // Removed useCreateIndex and useFindAndModify as they are deprecated in Mongoose 6+
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;