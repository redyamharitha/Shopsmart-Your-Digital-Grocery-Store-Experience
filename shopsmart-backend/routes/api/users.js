const express = require('express');
const router = express.Router(); // <--- This line should ONLY appear ONCE at the top
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User'); // Adjust path as necessary

// @route   POST api/users
// @desc    Register regular user
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // Default role is 'user' as per UserSchema default value
      user = new User({
        name,
        email,
        password
        // Role defaults to 'user' from schema
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
          role: user.role // Include role in JWT payload (will be 'user')
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: '5h' }, // Token expires in 5 hours
        (err, token) => {
          if (err) throw err;
          // Return token and role (which will be 'user')
          res.json({ token, role: user.role, userId: user.id });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/users/admin-register
// @desc    Register Admin user (with secret key)
// @access  Public (but protected by admin_secret_key)
router.post(
  '/admin-register', // <--- NEW ROUTE PATH
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    check('admin_secret_key', 'Admin secret key is required').not().isEmpty() // <--- NEW VALIDATION
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, admin_secret_key } = req.body;

    // --- IMPORTANT: Check admin secret key ---
    if (admin_secret_key !== config.get('admin_secret_key')) {
      return res.status(403).json({ errors: [{ msg: 'Invalid Admin Secret Key' }] });
    }
    // --- END IMPORTANT CHECK ---

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        email,
        password,
        role: 'admin' // <--- SET ROLE TO ADMIN HERE
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
          role: user.role // Will be 'admin'
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          // Return token and role (which will be 'admin')
          res.json({ token, role: user.role, userId: user.id });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;