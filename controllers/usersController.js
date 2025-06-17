// controllers/usersController.js - Promise-based version
const db = require('../db');

exports.signup = async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
        return res.status(400).send('All fields are required');
    }

    const query = 'INSERT INTO users (username, userEmail, userPassword, userRole, userImage) VALUES (?, ?, ?, ?, ?)';
    const values = [username, email, password, role, req.file ? req.file.filename : null];

    try {
        await db.query(query, values);
        res.send(`
            <script>
                alert('Sign up successful! Redirecting to login page.');
                window.location.href = '/login';
            </script>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving user');
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ? AND userPassword = ?';
    const values = [username, password];

    try {
        const [results] = await db.query(query, values);
        if (results.length === 0) {
            return res.send(`
                <script>
                    alert('Invalid credentials');
                    window.location.href = '/login';
                </script>
            `);
        }

        const user = results[0];
        req.session.user = {
            id: user.userId,
            username: user.username,
            role: user.userRole,
        };
        req.session.userId = user.userId;

        const redirectUrl = user.userRole === 'admin' ? '/admin' : '/user';
        return res.send(`
            <script>
                alert('Login successful! Redirecting to ${user.userRole === 'admin' ? 'admin dashboard' : 'homepage'}');
                window.location.href = '${redirectUrl}';
            </script>
        `);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM users');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).send('You need to log in first');

    try {
        const [userResults] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
        if (userResults.length === 0) return res.status(404).send('User not found');

        const user = userResults[0];
        const [transactions] = await db.query('SELECT * FROM transactions WHERE userId = ?', [userId]);
        transactions.forEach(tx => {
            tx.totalAmount = parseFloat(tx.totalAmount) || 0;
        });

        res.render('profile', { user, transactions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.session.user?.id;
    const { username, email, password } = req.body;
    if (!userId) return res.status(401).send('You need to log in first');

    const query = 'UPDATE users SET username = ?, userEmail = ?, userPassword = ? WHERE userId = ?';
    const values = [username, email, password, userId];

    try {
        const [results] = await db.query(query, values);
        if (results.affectedRows === 0) return res.status(404).send('User not found or no changes made');

        res.redirect('/profile');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAbout = (req, res) => {
    res.render('about');
};

exports.getLocation = (req, res) => {
    res.render('location');
};

exports.getLogin = (req, res) => {
    res.render('homepage');
};
