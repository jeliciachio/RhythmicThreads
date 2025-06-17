
const db = require('../db');

// Get user's cart items
exports.getUserCarts = async (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) return res.redirect('/login');

    const query = `
        SELECT c.cartId, c.itemType, c.quantity, c.addedAt,
               CASE WHEN c.itemType = 'Clothes' THEN cl.clothingName
                    WHEN c.itemType = 'Vinyls' THEN v.vinylName END AS productName,
               CASE WHEN c.itemType = 'Clothes' THEN CAST(cl.clothingPrice AS DECIMAL(10, 2))
                    WHEN c.itemType = 'Vinyls' THEN CAST(v.vinylPrice AS DECIMAL(10, 2)) END AS productPrice,
               CASE WHEN c.itemType = 'Clothes' THEN cl.clothingImage
                    WHEN c.itemType = 'Vinyls' THEN v.vinylImage END AS productImage
        FROM Cart c
        LEFT JOIN Clothes cl ON c.itemId = cl.clothingId AND c.itemType = 'Clothes'
        LEFT JOIN Vinyls v ON c.itemId = v.vinylId AND c.itemType = 'Vinyls'
        WHERE c.userId = ?`;

    try {
        const [results] = await db.query(query, [userId]);
        res.render('cart', { carts: results });
    } catch (err) {
        console.error('Error fetching cart items:', err);
        res.status(500).send('Error fetching cart items');
    }
};

// Add item to cart
exports.addItemToCart = async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "User must be logged in." });
    const userId = req.session.user.id;
    const { itemId, itemType, quantity } = req.body;

    if (!itemId || !itemType || !quantity) return res.status(400).json({ error: "Missing required fields." });

    let stockQuery;
    if (itemType === "Clothes") {
        stockQuery = "SELECT clothingStock AS stock FROM Clothes WHERE clothingId = ?";
    } else if (itemType === "Vinyls") {
        stockQuery = "SELECT vinylStock AS stock FROM Vinyls WHERE vinylId = ?";
    } else {
        return res.status(400).json({ error: "Invalid item type." });
    }

    try {
        const [stockResult] = await db.query(stockQuery, [itemId]);
        if (stockResult.length === 0) return res.status(404).json({ error: "Item not found." });

        const stock = stockResult[0].stock;
        if (stock < quantity) return res.status(400).json({ error: "Not enough stock available." });

        const insertQuery = "INSERT INTO cart (userId, itemType, itemId, quantity) VALUES (?, ?, ?, ?)";
        await db.query(insertQuery, [userId, itemType, itemId, quantity]);
        res.redirect('/cart');
    } catch (err) {
        console.error("Error adding to cart:", err);
        res.status(500).json({ error: "Error adding item to cart" });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    try {
        await db.query('UPDATE Cart SET quantity = ? WHERE cartId = ?', [quantity, id]);
        res.redirect('/cart');
    } catch (err) {
        console.error('Error updating cart item:', err);
        res.status(500).send('Error updating cart item');
    }
};

// Remove item from cart
exports.removeItemFromCart = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM Cart WHERE cartId = ?', [id]);
        res.redirect('/cart');
    } catch (err) {
        console.error('Error deleting cart item:', err);
        res.status(500).send('Error deleting cart item');
    }
};

// Checkout: Move cart items to Transactions table
exports.checkout = async (req, res) => {
    const userId = req.session.user?.id;
    const paymentMethod = req.body.paymentMethod || "Cash";
    const { orderId, transactionId } = req.body;

    if (!userId) return res.redirect('/login');

    const cartQuery = `SELECT c.cartId, c.itemType, c.quantity,
                              CASE WHEN c.itemType = 'Clothes' THEN cl.clothingPrice
                                   WHEN c.itemType = 'Vinyls' THEN v.vinylPrice END AS itemPrice,
                              CASE WHEN c.itemType = 'Clothes' THEN cl.clothingName
                                   WHEN c.itemType = 'Vinyls' THEN v.vinylName END AS productName
                       FROM Cart c
                       LEFT JOIN Clothes cl ON c.itemId = cl.clothingId AND c.itemType = 'Clothes'
                       LEFT JOIN Vinyls v ON c.itemId = v.vinylId AND c.itemType = 'Vinyls'
                       WHERE c.userId = ?`;

    const userQuery = 'SELECT username, userEmail FROM users WHERE userId = ?';

    try {
        const [cartItems] = await db.query(cartQuery, [userId]);
        if (cartItems.length === 0) return res.status(400).send('Your cart is empty.');

        const [userResult] = await db.query(userQuery, [userId]);
        if (userResult.length === 0) return res.status(400).send('User not found.');

        const { username, userEmail } = userResult[0];
        const totalAmount = cartItems.reduce((total, item) => total + item.quantity * item.itemPrice, 0);
        const itemsPurchased = JSON.stringify(cartItems);

        const insertTransaction = `INSERT INTO Transactions 
            (userId, username, userEmail, transactionDate, itemsPurchased, totalAmount, paymentMethod, orderId, transactionsId) 
            VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?)`;

        await db.query(insertTransaction, [userId, username, userEmail, itemsPurchased, totalAmount, paymentMethod, orderId, transactionId]);
        res.redirect(`/invoice/${orderId}`);
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).send('Error during checkout.');
    }
};

// Render payment page
exports.renderPaymentPage = async (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).send('User not logged in.');

    const cartQuery = `SELECT c.cartId, c.itemType, c.quantity,
                              CASE WHEN c.itemType = 'Clothes' THEN cl.clothingPrice
                                   WHEN c.itemType = 'Vinyls' THEN v.vinylPrice END AS itemPrice,
                              CASE WHEN c.itemType = 'Clothes' THEN cl.clothingName
                                   WHEN c.itemType = 'Vinyls' THEN v.vinylName END AS productName
                       FROM Cart c
                       LEFT JOIN Clothes cl ON c.itemId = cl.clothingId AND c.itemType = 'Clothes'
                       LEFT JOIN Vinyls v ON c.itemId = v.vinylId AND c.itemType = 'Vinyls'
                       WHERE c.userId = ?`;
    try {
        const [cartItems] = await db.query(cartQuery, [userId]);
        if (cartItems.length === 0) return res.status(400).send('Your cart is empty.');

        const totalAmount = cartItems.reduce((total, item) => total + item.quantity * item.itemPrice, 0);
        res.render('payment', { cartItems, totalAmount });
    } catch (err) {
        console.error('Error rendering payment page:', err);
        res.status(500).send('Error rendering payment page');
    }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).send('User not logged in.');

    const cartQuery = `SELECT c.cartId, c.itemType, c.quantity,
                              CASE WHEN c.itemType = 'Clothes' THEN cl.clothingPrice
                                   WHEN c.itemType = 'Vinyls' THEN v.vinylPrice END AS itemPrice,
                              CASE WHEN c.itemType = 'Clothes' THEN cl.clothingName
                                   WHEN c.itemType = 'Vinyls' THEN v.vinylName END AS productName
                       FROM Cart c
                       LEFT JOIN Clothes cl ON c.itemId = cl.clothingId AND c.itemType = 'Clothes'
                       LEFT JOIN Vinyls v ON c.itemId = v.vinylId AND c.itemType = 'Vinyls'
                       WHERE c.userId = ?`;

    try {
        const [cartItems] = await db.query(cartQuery, [userId]);
        if (cartItems.length === 0) return res.status(400).send('Your cart is empty.');

        const totalAmount = cartItems.reduce((total, item) => total + item.quantity * item.itemPrice, 0);
        const itemsPurchased = JSON.stringify(cartItems);

        const transactionQuery = `INSERT INTO Transactions (userId, transactionDate, itemsPurchased, totalAmount) VALUES (?, NOW(), ?, ?)`;
        await db.query(transactionQuery, [userId, itemsPurchased, totalAmount]);

        await db.query('DELETE FROM Cart WHERE userId = ?', [userId]);
        res.redirect('/profile');
    } catch (err) {
        console.error('Error confirming payment:', err);
        res.status(500).send('Error during payment confirmation.');
    }
};
