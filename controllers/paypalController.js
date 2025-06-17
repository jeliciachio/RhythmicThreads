const PAYPAL_CLIENT_ID = "ARRqLPeH8SOSWP1Q2OeiiVScAXQuiJaOYzavA9LUVXws5PsraH7wewUZEIIjg19EyKvSsRac8lNSZnJh";
const PAYPAL_CLIENT_SECRET = "EEL36RCABIuz_jcPXcBoAtfOvqgUg6c0fnDjUnyrdQNWFY4vPmY1Pmq-0uTI9fib29N1OglvC9S50NKV";
const BASE = "https://api-m.sandbox.paypal.com";

// export default async function generateAccessToken() {
    async function generateAccessToken() {
        // To base64 encode your client id and secret
        const BASE64_ENCODED_CLIENT_ID_AND_SECRET = Buffer.from(
            `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
        ).toString("base64");
    
        const request = await fetch(
            "https://api-m.sandbox.paypal.com/v1/oauth2/token",
            {
                method: "POST",
                headers: {
                    Authorization: `Basic ${BASE64_ENCODED_CLIENT_ID_AND_SECRET}`,
                },
                body: new URLSearchParams({
                    grant_type: "client_credentials",
                    response_type: "id_token",
                    intent: "sdk_init",
                }),
            }
        );
        const json = await request.json();
        return json.access_token;
    }

    async function createOrder(cart) {
        if (!cart || cart.length === 0) {
            throw new Error("Cart is empty or not passed correctly.");
        }
    
        const processedItems = cart.map(item => {
            if (!item.itemPrice) {
                console.error("Error: Missing itemPrice for item", item);
                throw new Error(`Item ${item.productName} has no price.`);
            }
    
            return {
                name: item.productName,
                unit_amount: { currency_code: "SGD", value: Number(item.itemPrice).toFixed(2) },
                quantity: item.quantity.toString(),
            };
        });
    
        const totalAmount = cart.reduce((sum, item) => {
            if (!item.itemPrice) throw new Error("Invalid item price detected.");
            return sum + (item.quantity * item.itemPrice);
        }, 0).toFixed(2);
    
        const accessToken = await generateAccessToken();
        const response = await fetch(`${BASE}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [{
                    items: processedItems,
                    amount: {
                        currency_code: "SGD",
                        value: totalAmount,
                        breakdown: { item_total: { currency_code: "SGD", value: totalAmount } },
                    },
                }],
            }),
        });
    
        return response.json();
    }
    

async function captureOrder(orderID) {
    const accessToken = await generateAccessToken();
    const response = await fetch(`${BASE}/v2/checkout/orders/${orderID}/capture`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });

    return response.json();
}

// Express Route Handlers
exports.createOrderHandler = async (req, res) => {
    try {
        const { cart } = req.body;
        const order = await createOrder(cart);
        res.status(200).json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Failed to create PayPal order." });
    }
};

exports.captureOrderHandler = async (req, res) => {
    try {
        const { orderID } = req.params;
        const result = await captureOrder(orderID);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error capturing order:", error);
        res.status(500).json({ error: "Failed to capture PayPal order." });
    }
};
