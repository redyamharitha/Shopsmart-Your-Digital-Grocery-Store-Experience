const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
const Product = require('../../models/Product');
const Cart = require('../../models/Cart');

// Utility function to get populated cart
const getPopulatedCart = async (userId) => {
    return await Cart.findOne({ user: userId }).populate('items.product', ['name', 'price', 'imageUrl', 'stock']); // Added stock for frontend checks
};


// @route   GET api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const cart = await getPopulatedCart(req.user.id);
        if (!cart) {
            // If no cart exists, create an empty one for the user
            const newCart = new Cart({ user: req.user.id, items: [] });
            await newCart.save();
            // Return the newly created empty cart (which is not yet populated, so explicitly return its base structure)
            return res.status(200).json({ _id: newCart._id, user: newCart.user, items: [], date: newCart.date });
        }
        res.json(cart);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/cart/add
// @desc    Add item to cart or update quantity
// @access  Private
router.post(
    '/add',
    [
        auth,
        [
            check('productId', 'Product ID is required').not().isEmpty(),
            check('quantity', 'Quantity is required and must be a number').isInt({ min: 1 })
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { productId, quantity } = req.body;

        try {
            let cart = await Cart.findOne({ user: req.user.id });
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({ msg: 'Product not found' });
            }

            if (!cart) {
                // If cart doesn't exist for the user, create a new one
                cart = new Cart({
                    user: req.user.id,
                    items: []
                });
            }

            // Check if item is already in cart
            let itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

            if (itemIndex > -1) {
                // Product exists in the cart, update the quantity
                const newQuantity = cart.items[itemIndex].quantity + quantity;
                if (product.stock < newQuantity) {
                    return res.status(400).json({ msg: `Not enough stock for ${product.name}. Available: ${product.stock}` });
                }
                cart.items[itemIndex].quantity = newQuantity;
            } else {
                // Product does not exist in cart, add new item
                if (product.stock < quantity) {
                    return res.status(400).json({ msg: `Not enough stock for ${product.name}. Available: ${product.stock}` });
                }
                cart.items.push({ product: productId, quantity });
            }

            await cart.save();
            const populatedCart = await getPopulatedCart(req.user.id);
            res.json(populatedCart);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   DELETE api/cart/remove/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:productId', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({ msg: 'Cart not found' });
        }

        // Filter out the item to be removed
        const initialItemCount = cart.items.length;
        cart.items = cart.items.filter(
            item => item.product.toString() !== req.params.productId
        );

        if (cart.items.length === initialItemCount) {
             return res.status(404).json({ msg: 'Product not found in cart.' });
        }

        await cart.save();
        const populatedCart = await getPopulatedCart(req.user.id);
        res.json(populatedCart); // Send back updated populated cart
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/cart/update-quantity
// @desc    Update quantity of an item in cart
// @access  Private
router.put(
    '/update-quantity',
    [
        auth,
        [
            check('productId', 'Product ID is required').not().isEmpty(),
            check('quantity', 'Quantity is required and must be a number').isInt({ min: 0 })
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { productId, quantity } = req.body;

        try {
            let cart = await Cart.findOne({ user: req.user.id });

            if (!cart) {
                return res.status(404).json({ msg: 'Cart not found' });
            }

            let itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

            if (itemIndex === -1) {
                return res.status(404).json({ msg: 'Product not found in cart' });
            }

            if (quantity === 0) {
                // Remove item if quantity is 0
                cart.items = cart.items.filter(item => item.product.toString() !== productId);
            } else {
                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).json({ msg: 'Product not found' });
                }
                if (product.stock < quantity) {
                    return res.status(400).json({ msg: `Not enough stock for ${product.name}. Available: ${product.stock}` });
                }
                cart.items[itemIndex].quantity = quantity;
            }

            await cart.save();
            const populatedCart = await getPopulatedCart(req.user.id);
            res.json(populatedCart);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   DELETE api/cart/clear
// @desc    Clear user's entire cart
// @access  Private
router.delete('/clear', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({ msg: 'Cart not found for this user.' });
        }

        cart.items = []; // Empty the items array
        await cart.save();

        res.json({ msg: 'Cart cleared successfully', cart });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;