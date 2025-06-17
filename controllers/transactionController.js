
const db = require('../db');

// Function to update stock after purchase
const updateStockAfterPurchase = async (cartItems) => {
    for (let item of cartItems) {
        let table = item.itemType === "Clothes" ? "Clothes" : "Vinyls";
        let columnId = item.itemType === "Clothes" ? "clothingId" : "vinylId";
        let stockColumn = item.itemType === "Clothes" ? "clothingStock" : "vinylStock";

        const query = `UPDATE ${table} SET ${stockColumn} = ${stockColumn} - ? WHERE ${columnId} = ? AND ${stockColumn} >= ?`;
        try {
            const [result] = await db.query(query, [item.quantity, item.itemId, item.quantity]);
            if (result.affectedRows === 0) {
                console.log(`Stock insufficient for ${item.productName}`);
            }
        } catch (err) {
            console.error("Stock update failed:", err);
        }
    }
};

// Function to check stock availability before purchase
const checkStockBeforePurchase = async (cartItems) => {
    for (let item of cartItems) {
        let table = item.itemType === "Clothes" ? "Clothes" : "Vinyls";
        let columnId = item.itemType === "Clothes" ? "clothingId" : "vinylId";
        let stockColumn = item.itemType === "Clothes" ? "clothingStock" : "vinylStock";

        const query = `SELECT ${stockColumn} AS stock FROM ${table} WHERE ${columnId} = ?`;
        try {
            const [results] = await db.query(query, [item.itemId]);
            const stock = results[0]?.stock || 0;
            if (stock < item.quantity) {
                return { success: false, message: `No more stock for ${item.productName}` };
            }
        } catch (err) {
            return { success: false, message: `Error checking stock for ${item.productName}` };
        }
    }
    return { success: true };
};

// Function to confirm payment and process order
exports.confirmPayment = async (req, res) => {
    const userId = req.session.user?.id;
    const { cartItems, totalAmount, paymentMethod, username, userEmail } = req.body;

    if (!userId) return res.status(401).json({ error: "User not logged in." });
    if (!cartItems || cartItems.length === 0) return res.status(400).json({ error: "Cart is empty." });

    const stockCheck = await checkStockBeforePurchase(cartItems);
    if (!stockCheck.success) return res.status(400).json({ error: stockCheck.message });

    const itemsPurchased = JSON.stringify(cartItems);
    const safePaymentMethod = paymentMethod || "Cash";

    const insertQuery = `
        INSERT INTO Transactions (userId, username, userEmail, transactionDate, itemsPurchased, totalAmount, paymentMethod)
        VALUES (?, ?, ?, NOW(), ?, ?, ?)`;

    try {
        const [result] = await db.query(insertQuery, [userId, username, userEmail, itemsPurchased, totalAmount, safePaymentMethod]);
        await updateStockAfterPurchase(cartItems);
        res.redirect(`/invoice/${result.insertId}`);
    } catch (err) {
        console.error("Error inserting transaction:", err);
        res.status(500).send("Error during checkout.");
    }
};

// Admin: View all transactions
exports.getAllTransactions = async (req, res) => {
    const query = `
        SELECT t.transactionsId,
               COALESCE(t.orderId, 'N/A') AS orderId,
               t.userId,
               u.username,
               u.userEmail,
               t.transactionDate,
               t.itemsPurchased,
               t.totalAmount
        FROM Transactions t
        JOIN users u ON t.userId = u.userId`;

    try {
        const [results] = await db.query(query);
        results.forEach(transaction => {
            if (typeof transaction.itemsPurchased === 'string') {
                try {
                    transaction.itemsPurchased = JSON.parse(transaction.itemsPurchased);
                } catch (error) {
                    console.error("Error parsing itemsPurchased JSON:", error);
                    transaction.itemsPurchased = [];
                }
            }
        });
        res.render('viewTransactions', { transactions: results });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).send('Error fetching transactions.');
    }
};

// User: View own transactions
exports.getUserTransactions = async (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).send('User not logged in.');

    const query = 'SELECT transactionsId, orderId, transactionDate, itemsPurchased, totalAmount FROM Transactions WHERE userId = ?';

    try {
        const [results] = await db.query(query, [userId]);
        results.forEach(transaction => {
            transaction.totalAmount = parseFloat(transaction.totalAmount);
        });
        res.render('profile', { transactions: results, user: req.session.user });
    } catch (err) {
        console.error('Error fetching user transactions:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getInvoice = async (req, res) => {
    const { transactionId } = req.params;
    const query = 'SELECT * FROM Transactions WHERE transactionsId = ? OR orderId = ?';

    try {
        const [result] = await db.query(query, [transactionId, transactionId]);
        if (result.length === 0) return res.status(404).send('Transaction not found.');
        res.render('invoice', { transaction: result[0] });
    } catch (err) {
        console.error('Error fetching transaction:', err);
        res.status(500).send('Error loading invoice.');
    }
};


exports.handleNetsSuccess = async (req, res) => {
  const userId = req.session.user?.id;
  const { cartItems, totalAmount, username, userEmail } = req.body;

  if (!userId || !cartItems || !totalAmount) {
    return res.status(400).send('Missing transaction data.');
  }

  const itemsPurchased = JSON.stringify(cartItems);
  const paymentMethod = "NETS QR";

  const insertQuery = `
    INSERT INTO Transactions (userId, username, userEmail, transactionDate, itemsPurchased, totalAmount, paymentMethod)
    VALUES (?, ?, ?, NOW(), ?, ?, ?)`;

  try {
    const [result] = await db.query(insertQuery, [
      userId,
      username,
      userEmail,
      itemsPurchased,
      totalAmount,
      paymentMethod,
    ]);
    res.render("netsTxnSuccessStatus", {
        transactionId: result.insertId,
    });
  } catch (err) {
    console.error("Error saving NETS QR transaction:", err);
    res.status(500).send("Transaction failed to save.");
  }
};