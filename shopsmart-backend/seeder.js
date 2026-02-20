// shopsmart-backend/seeder.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env vars
// This tells dotenv to look for the .env file directly in the current directory (shopsmart-backend)
dotenv.config({ path: './.env' });

// Load models
const Product = require('./models/Product');
const Category = require('./models/Category');
const User = require('./models/User'); // Assuming you have a User model

// Connect to DB
const connectDB = async () => {
    try {
        console.log('--- SEEDER CONNECTION STARTUP ENV CHECK ---');
        console.log('Attempting to connect with MONGO_URI (seeder):', process.env.MONGO_URI);
        console.log('--------------------------------');

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected (seeder): ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error (seeder): ${err.message}`);
        process.exit(1);
    }
};

// Call connectDB immediately to ensure connection is established before data operations
connectDB();

// Read JSON files (assuming these exist in a 'data' folder in your backend root)
// If you don't have these files yet, create them as instructed previously.
const products = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './data/products.json'), 'utf-8')
);
const categories = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './data/categories.json'), 'utf-8')
);
const users = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './data/users.json'), 'utf-8')
);


// Import into DB
const importData = async () => {
    try {
        await Product.deleteMany();
        await Category.deleteMany();
        await User.deleteMany(); // Clear existing users

        // Ensure categories are imported first if products depend on them
        await Category.insertMany(categories);
        await User.insertMany(users);
        await Product.insertMany(products); // Assuming products might reference categories

        console.log('Data Imported!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await Product.deleteMany();
        await Category.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

// This part checks the command-line arguments to determine whether to import or delete data
if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
} else {
    console.log('Please specify -i for import or -d for delete');
    process.exit(1);
}