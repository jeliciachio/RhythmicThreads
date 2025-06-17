
const db = require('../db');

// User signup handler
exports.signup = async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        // Validate password: 5–7 characters with at least one special character
        const passwordPattern = /^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{5,7}$/;
        if (!passwordPattern.test(password)) {
            return res.send(`
                <script>
                    alert('Password must be 5-7 characters long and include at least one special character.');
                    window.location.href='/signup';
                </script>
            `);
        }

        const values = [
            username,
            email,
            password, // ✅ Use the plain password (validated above)
            role,
            req.file ? req.file.filename : null
        ];

        const query = 'INSERT INTO users (username, userEmail, userPassword, userRole, userImage) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, values);

        res.send(`
            <script>
                alert('Sign up successful! Redirecting to login page.');
                window.location.href = '/login';
            </script>
        `);
    } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).send('Error during signup');
    }
};


// User login handler
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = 'SELECT * FROM users WHERE username = ?';
        const [results] = await db.query(query, [username]);

        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        const user = results[0];
        if (password !== user.userPassword) {
            return res.status(401).send('Invalid email or password');
        }

        req.session.user = {
            id: user.userId,
            username: user.username,
            role: user.userRole
        };

        res.redirect('/');
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Error during login');
    }
};

// Middleware to authenticate user
exports.authenticate = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};
