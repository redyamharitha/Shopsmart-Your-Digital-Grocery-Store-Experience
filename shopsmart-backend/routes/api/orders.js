const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const config = require('config');

// Initialize Stripe only if stripeSecretKey is available in config
let stripe;
const stripeSecretKey = config.get('stripeSecretKey');
if (stripeSecretKey) {
    stripe = require('stripe')(stripeSecretKey);
} else {
    console.warn('Stripe Secret Key not found in config. Stripe payment processing will be skipped.');
}

const User = require('../../models/User');
const Product = require('../../models/Product');
const Cart = require('../../models/Cart');
const Order = require('../../models/Order');

// @route   POST api/orders/checkout
// @desc    Process checkout and create a new order
// @access  Private
router.post(
    '/checkout',
    auth,
    async (req, res) => {
        // paymentMethodId will be null/undefined for Cash on Delivery
        const { shippingAddress, paymentMethod, paymentMethodId, clientSecret } = req.body;

        // Basic validation for shippingAddress
        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.country) {
            return res.status(400).json({ msg: 'Shipping address is incomplete. Missing street, city, state, zip, or country.' });
        }

        try {
            const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ msg: 'Your cart is empty' });
            }

            let totalAmount = 0;
            const orderItems = [];

            for (let cartItem of cart.items) {
                const product = cartItem.product;
                if (!product) {
                    return res.status(404).json({ msg: `Product with ID ${cartItem.product} not found.` });
                }

                if (product.stock < cartItem.quantity) {
                    return res.status(400).json({ msg: `Not enough stock for ${product.name}. Available: ${product.stock}` });
                }

                // Deduct stock
                product.stock -= cartItem.quantity;
                await product.save();

                totalAmount += product.price * cartItem.quantity;
                orderItems.push({
                    product: product._id,
                    quantity: cartItem.quantity,
                    priceAtPurchase: product.price
                });
            }

            let newOrder;
            let paymentStatus = 'pending'; // Default for COD or failed payment
            let orderStatus = 'pending'; // Default initial order status (changed from 'Pending')
            let stripePaymentIntentId = null;
            let stripeClientSecret = null;

            // --- IMPORTANT: Conditional Stripe Payment Processing ---
            if (paymentMethod === 'Credit Card' && stripe && paymentMethodId) { // Only process Stripe if paymentMethod is 'Credit Card' and Stripe is initialized
                try {
                    const paymentIntent = await stripe.paymentIntents.create({
                        amount: Math.round(totalAmount * 100), // Stripe expects amount in cents
                        currency: 'usd', // Or your desired currency
                        payment_method: paymentMethodId, // Attach a payment method if provided from frontend
                        confirm: true, // Confirm the payment intent immediately
                        // return_url: 'http://localhost:4200/checkout-success', // For 3D secure, might be handled client-side
                        metadata: {
                            order_id: 'temp_order_id_placeholder', // Will be updated after order save
                            user_id: req.user.id.toString()
                        }
                    });

                    paymentStatus = paymentIntent.status === 'succeeded' ? 'paid' : 'failed';
                    orderStatus = paymentIntent.status === 'succeeded' ? 'processing' : 'pending'; // <--- CHANGED: from 'Confirmed' to 'processing'
                    stripePaymentIntentId = paymentIntent.id;
                    stripeClientSecret = paymentIntent.client_secret;

                    if (paymentIntent.status !== 'succeeded') {
                        // If payment failed, do not proceed with order creation or clear cart
                        return res.status(400).json({ msg: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error.'}` });
                    }

                } catch (stripeErr) {
                    console.error('Stripe Payment Intent Error:', stripeErr.message);
                    return res.status(400).json({ msg: `Payment processing failed: ${stripeErr.message}` });
                }
            } else if (paymentMethod === 'Cash on Delivery') {
                paymentStatus = 'pending'; // Cash on Delivery is pending until received
                orderStatus = 'processing'; // <--- CHANGED: from 'Confirmed' to 'processing' (Order is confirmed, now being processed)
            } else {
                 // Fallback if paymentMethod is unknown or stripe not configured for Credit Card
                return res.status(400).json({ msg: 'Invalid payment method or Stripe not configured for credit card payments.' });
            }

            // Create the order
            newOrder = new Order({
                user: req.user.id,
                items: orderItems,
                totalAmount: totalAmount,
                shippingAddress: shippingAddress,
                paymentStatus: paymentStatus,
                orderStatus: orderStatus, // Will be 'processing' or 'pending' now
                paymentIntentId: stripePaymentIntentId // Will be null for COD
            });

            const order = await newOrder.save();

            // Only update payment intent metadata if Stripe was actually used
            if (stripePaymentIntentId && stripe) {
                await stripe.paymentIntents.update(stripePaymentIntentId, {
                    metadata: { order_id: order._id.toString() }
                });
            }

            // Clear the user's cart after creating the order
            cart.items = [];
            await cart.save();

            res.json({
                order: order,
                clientSecret: stripeClientSecret, // Will be null for COD
                msg: 'Order created successfully!'
            });

        } catch (err) {
            console.error(err.message);
            // More granular error handling for Stripe
            if (err.type === 'StripeCardError' || err.type === 'StripeInvalidRequestError') {
                return res.status(400).json({ msg: err.message });
            }
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET api/orders
// @desc    Get all orders for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('items.product', ['name', 'price', 'imageUrl']);
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/orders/all (Admin)
// @desc    Get all orders (for admin dashboard)
// @access  Private (Admin only)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Authorization denied, admin access required' });
    }
    try {
        const orders = await Order.find().populate('user', 'name email').populate('items.product', ['name', 'price', 'imageUrl']);
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/orders/:id
// @desc    Get a specific order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product', ['name', 'price', 'imageUrl']);

        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Ensure user owns the order or is an admin
        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized for this order' });
        }

        res.json(order);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Order not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private (Admin only)
router.put('/:id/status', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Authorization denied, admin access required' });
    }

    const { orderStatus } = req.body;

    try {
        let order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        order.orderStatus = orderStatus;
        await order.save();
        res.json(order);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Order not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        let order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Ensure user owns the order or is an admin
        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized to cancel this order' });
        }

        // Only allow cancellation if order is in a cancellable state (e.g., 'pending', 'processing')
        // Prevent cancelling if already cancelled, shipped, or delivered
        if (order.orderStatus === 'cancelled' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered') { // <--- Adjusted enum values
            return res.status(400).json({ msg: `Order cannot be cancelled. Current status: ${order.orderStatus}` });
        }

        order.orderStatus = 'cancelled'; // <--- Adjusted enum values
        // TODO: Add logic here to restock products if the order is cancelled (optional, based on business logic)
        await order.save();

        res.json({ msg: 'Order cancelled successfully', order });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Order not found' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/orders/webhook
// @desc    Stripe webhook for payment intent updates
// @access  Public (Stripe only)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    const endpointSecret = config.get('stripeWebhookSecret'); // Will need to add this to config

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;
            // Then update your database: Find the order by paymentIntentId and update its status
            await Order.findOneAndUpdate(
                { paymentIntentId: paymentIntentSucceeded.id },
                { $set: { paymentStatus: 'paid' } },
                { new: true }
            );
            console.log(`PaymentIntent for ${paymentIntentSucceeded.amount} was successful!`);
            break;
        case 'payment_intent.payment_failed':
            const paymentIntentFailed = event.data.object;
            await Order.findOneAndUpdate(
                { paymentIntentId: paymentIntentFailed.id },
                { $set: { paymentStatus: 'failed' } },
                { new: true }
            );
            console.log(`PaymentIntent for ${paymentIntentFailed.amount} failed!`);
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

module.exports = router;