const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import middleware (ensure correct paths)
const auth = require('../../middleware/auth'); // For general authentication (used by GET /api/products)
const adminAuth = require('../../middleware/adminAuth'); // <--- IMPORTANT: For admin-specific authentication

const Product = require('../../models/Product'); // Adjust path as necessary
const Category = require('../../models/Category'); // Adjust path as necessary

// @route   POST api/products
// @desc    Add a new product (ADMIN ONLY)
// @access  Private (Admin)
router.post(
  '/',
  [
    adminAuth, // <--- MODIFIED: Use adminAuth middleware here
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('price', 'Price is required and must be a number').isNumeric(),
      check('category', 'Category is required').not().isEmpty(),
      check('imageUrl', 'Image URL is required').not().isEmpty(), // Ensure imageUrl is validated
      check('stock', 'Stock is required and must be a number').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // REMOVED: Manual role check is now handled by adminAuth middleware
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ msg: 'Authorization denied, admin access required' });
    // }

    const { name, description, price, category, imageUrl, stock } = req.body;

    try {
      // Check if category exists by ID
      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        return res.status(404).json({ msg: 'Category not found' });
      }

      const newProduct = new Product({
        name,
        description,
        price,
        category, // This should be the category ID
        imageUrl,
        stock,
        rating: req.body.rating || 0 // Assuming default rating 0 if not provided, or remove if not applicable
      });

      const product = await newProduct.save();
      res.json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Populate category with just the 'name' field
    const products = await Product.find().populate('category', 'category'); // <--- CHECK: Your Product schema might refer to Category.category (string) not Category.name
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'category'); // <--- CHECK: Your Product schema might refer to Category.category (string) not Category.name
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/products/:id
// @desc    Update a product (ADMIN ONLY)
// @access  Private (Admin)
router.put(
  '/:id',
  [
    adminAuth, // <--- MODIFIED: Use adminAuth middleware here
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('price', 'Price is required and must be a number').isNumeric(),
      check('category', 'Category is required').not().isEmpty(),
      check('imageUrl', 'Image URL is required').not().isEmpty(), // Ensure imageUrl is validated
      check('stock', 'Stock is required and must be a number').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // REMOVED: Manual role check is now handled by adminAuth middleware
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ msg: 'Authorization denied, admin access required' });
    // }

    const { name, description, price, category, imageUrl, stock } = req.body;

    // Build product object
    const productFields = {
      name,
      description,
      price,
      category,
      imageUrl,
      stock,
      rating: req.body.rating // Allow rating to be updated if provided, otherwise it keeps its value
    };

    try {
      let product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ msg: 'Product not found' });
      }

      // Check if category exists
      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        return res.status(404).json({ msg: 'Category not found' });
      }

      product = await Product.findOneAndUpdate(
        { _id: req.params.id },
        { $set: productFields },
        { new: true } // Return the updated document
      ).populate('category', 'category'); // Populate category name in the response

      res.json(product);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Product not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/products/:id
// @desc    Delete a product (ADMIN ONLY)
// @access  Private (Admin)
router.delete('/:id', adminAuth, async (req, res) => { // <--- MODIFIED: Use adminAuth middleware here
  // REMOVED: Manual role check is now handled by adminAuth middleware
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ msg: 'Authorization denied, admin access required' });
  // }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    await product.deleteOne(); // Use deleteOne() instead of remove()
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;