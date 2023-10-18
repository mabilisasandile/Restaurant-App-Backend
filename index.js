require('dotenv').config();
const express = require('express');
const cors = require("cors");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = 3080;

app.use(express.json());
app.use(cors());

app.post('/pay', async (req, res) => {
    try {
        // const { name } = req.body;
        // if (!name) return res.status(400).json({ message: 'Please enter a name' });
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000,
            currency: 'zar',
            payment_method_types: ["card"],
            // metadata: { name },
        });
        const clientSecret = paymentIntent.client_secret;
        res.json({ message: "Payment initiated", clientSecret });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/stripe', async (req, res) => {
    const sig = req.header['stripe-signature'];
    let event;

    try {
        event = await stripe.webooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }

    //Event when a payment is initiated
    if (event.type === "payment_intent.created") {
        console.log(`${event.data.object.metadata.name} initiated payment!`);
    }

    //Event when a payment is succeeded
    if (event.type === "payment_intent.succeeded") {
        console.log(`${event.data.object.metadata.name} succeeded payment!`);
        // Fulfilment
    }

    res.json({ ok: true });

});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

