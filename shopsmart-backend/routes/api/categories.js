const express = require('express');
const router = express.Router();
// const auth = require('../../middleware/auth'); // Original auth middleware
const adminAuth = require('../../middleware/adminAuth'); // <--- IMPORTANT: New adminAuth middleware
const { check, validationResult } = require('express-validator');

const Category = require('../../models/Category');

// @route   POST api/categories
// @desc    Add a new category (ADMIN ONLY)
// @access  Private (Admin only)
router.post(
  '/',
  [
    adminAuth, // <--- MODIFIED: Use adminAuth middleware here
    [
      check('name', 'Category name is required').not().isEmpty()
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

    const { name, image } = req.body;

    try {
      let category = await Category.findOne({ name });
      if (category) {
        return res.status(400).json({ msg: 'Category already exists' });
      }

      category = new Category({
        name,
        image
      });

      await category.save();
      res.json(category);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }); // Sort by name for consistency
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Category not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/categories/:id
// @desc    Update a category (ADMIN ONLY)
// @access  Private (Admin only)
router.put(
  '/:id',
  [
    adminAuth, // <--- MODIFIED: Use adminAuth middleware here
    [
      check('name', 'Category name is required').not().isEmpty()
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

    const { name, image } = req.body;
    const categoryFields = { name, image };

    try {
      let category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ msg: 'Category not found' });
      }

      // Check if category with this name already exists for a different ID
      const existingCategoryWithName = await Category.findOne({ name });
      if (existingCategoryWithName && existingCategoryWithName._id.toString() !== req.params.id) {
        return res.status(400).json({ msg: 'Category with this name already exists' });
      }

      category = await Category.findOneAndUpdate(
        { _id: req.params.id },
        { $set: categoryFields },
        { new: true }
      );

      res.json(category);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Category not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/categories/:id
// @desc    Delete a category (ADMIN ONLY)
// @access  Private (Admin only)
router.delete('/:id', adminAuth, async (req, res) => { // <--- MODIFIED: Use adminAuth middleware here
  // REMOVED: Manual role check is now handled by adminAuth middleware
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ msg: 'Authorization denied, admin access required' });
  // }

  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    await category.deleteOne();
    res.json({ msg: 'Category removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Category not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;