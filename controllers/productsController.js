const db = require('../db');

// Define the functions before exporting

// Get all Clothes
exports.getAllClothes = async (req, res) => {
    const filter = req.query.filter || 'all';
    let query = 'SELECT * FROM clothes';
    let queryParams = [];

    if (filter !== 'all') {
        query += ' WHERE productFilter = ?';
        queryParams.push(filter);
    }

    try {
        const [results] = await db.query(query, queryParams);
        const clothes = results.map(item => ({
            ...item,
            clothingImage: `/images/${item.clothingImage}`
        }));
        res.render('clothes', { clothes: results, filter });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get clothing details by ID
exports.getClothingById = async (req, res) => {
    const { id } = req.params;
    try {
        const [productResults] = await db.query('SELECT * FROM clothes WHERE clothingId = ?', [id]);
        if (productResults.length === 0) return res.status(404).render('error', { message: 'Product not found' });

        const [reviewResults] = await db.query('SELECT * FROM reviews WHERE productId = ?', [id]);
        res.render('viewClothes', {
            product: productResults[0],
            reviews: reviewResults,
            user: req.session.user || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all Vinyls
exports.getAllVinyls = async (req, res) => {
    const filter = req.query.filter || 'all';
    let query = 'SELECT * FROM vinyls';
    let queryParams = [];

    if (filter !== 'all') {
        query += ' WHERE productFilter = ?';
        queryParams.push(filter);
    }

    try {
        const [results] = await db.query(query, queryParams);
        const vinyls = results.map(item => ({
            ...item,
            vinylImage: `/images/${item.vinylImage}`
        }));
        res.render('vinyls', { vinyls: results, filter });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Vinyl details by ID
exports.getVinylById = async (req, res) => {
    const { id } = req.params;
    try {
        const [productResults] = await db.query('SELECT * FROM vinyls WHERE vinylId = ?', [id]);
        if (productResults.length === 0) return res.status(404).render('error', { message: 'Vinyl not found' });

        const [reviewResults] = await db.query('SELECT * FROM reviews WHERE productId = ?', [id]);
        res.render('viewVinyls', {
            vinyl: productResults[0],
            reviews: reviewResults,
            user: req.session.user || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    const { id, type } = req.params;
    let query = type === 'Clothes' ? 'SELECT * FROM clothes WHERE id = ?' :
                type === 'Vinyl' ? 'SELECT * FROM vinyls WHERE id = ?' : null;

    if (!query) return res.status(400).json({ message: 'Invalid product type' });

    try {
        const [results] = await db.query(query, [id]);
        if (results.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a product
exports.createProduct = async (req, res) => {
    const { type, name, description, price, stock, categoryId, image } = req.body;
    let table, columns, values;

    if (type === 'Clothes') {
        table = 'clothes';
        columns = '(clothingName, clothingDescription, clothingPrice, clothingStock, categoryId, clothingImage)';
        values = [name, description, price, stock, categoryId, image];
    } else if (type === 'Vinyl') {
        table = 'vinyls';
        columns = '(vinylName, vinylDescription, vinylPrice, vinylStock, categoryId, vinylImage)';
        values = [name, description, price, stock, categoryId, image];
    } else {
        return res.status(400).json({ error: 'Invalid product type' });
    }

    try {
        const [results] = await db.query(`INSERT INTO ${table} ${columns} VALUES (?, ?, ?, ?, ?, ?)`, values);
        res.status(201).json({ message: `${type} added successfully!`, id: results.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    const { id, type, name, description, price, stock } = req.body;
    let table, columns;

    if (type === 'Clothes') {
        table = 'clothes';
        columns = 'clothingName = ?, clothingDescription = ?, clothingPrice = ?, clothingStock = ?';
    } else if (type === 'Vinyl') {
        table = 'vinyls';
        columns = 'vinylName = ?, vinylDescription = ?, vinylPrice = ?, vinylStock = ?';
    } else {
        return res.status(400).json({ error: 'Invalid product type' });
    }

    try {
        await db.query(`UPDATE ${table} SET ${columns} WHERE id = ?`, [name, description, price, stock, id]);
        res.json({ message: `${type} updated successfully!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
    const { id, type } = req.body;
    let table;

    if (type === 'Clothes') {
        table = 'clothes';
    } else if (type === 'Vinyl') {
        table = 'vinyls';
    } else {
        return res.status(400).json({ error: 'Invalid product type' });
    }

    try {
        await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        res.json({ message: `${type} deleted successfully!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get the latest products
exports.getLatestProducts = async (req, res) => {
    try {
        const [results] = await db.query(`SELECT name, description, price, category, createdAt FROM WhatsNew ORDER BY createdAt DESC`);
        const formattedProducts = results.map(product => ({
            ...product,
            price: product.price ? parseFloat(product.price) : 0.00
        }));
        res.render('whatsnew', { products: formattedProducts });
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching latest products.' });
    }
};

// Add a review
exports.addReview = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'User must be logged in to write a review.' });
    }

    const { productId, productType, comment } = req.body;
    const userId = req.session.user.id;
    const username = req.session.user.username;

    if (!productId || !productType || !comment) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    let checkProductQuery;
    if (productType === 'Clothes') {
        checkProductQuery = 'SELECT * FROM clothes WHERE clothingId = ?';
    } else if (productType === 'Vinyls') {
        checkProductQuery = 'SELECT * FROM vinyls WHERE vinylId = ?';
    } else {
        return res.status(400).json({ error: 'Invalid product type.' });
    }

    try {
        const [result] = await db.query(checkProductQuery, [productId]);
        if (result.length === 0) return res.status(404).json({ error: 'Product not found.' });

        const insertQuery = `INSERT INTO reviews (userId, productId, productType, username, comment, createdAt) VALUES (?, ?, ?, ?, ?, NOW())`;
        await db.query(insertQuery, [userId, productId, productType, username, comment]);
        res.redirect(`/products/${productType.toLowerCase()}/${productId}`);
    } catch (err) {
        res.status(500).json({ error: 'Error adding review.' });
    }
};



  

