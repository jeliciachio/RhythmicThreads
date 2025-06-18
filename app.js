const express = require('express');
const multer = require('multer');
const session = require('express-session');
const db = require('./db');
const app = express();
const productsController = require('./controllers/productsController');
const usersController = require('./controllers/usersController');
const cartController = require('./controllers/cartController');
const transactionController = require('./controllers/transactionController');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const paypalController = require('./controllers/paypalController');
const netsQrController = require('./controllers/netsQrController');




// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up session middleware
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(session({
  key: 'session_cookie_name',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}));

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop(); // Extract file extension
        cb(null, `${Date.now()}.${ext}`); // Save as timestamp + extension
    }
});

const upload = multer({ storage });

require('dotenv').config();

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' folder
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Home route
app.get('/', (req, res) => {
    res.render('index');
});



// Authentication pages
app.get('/signup', (req, res) => res.render('signup'));
app.get('/login', (req, res) => res.render('login'));

// Middleware for role-based access control
const isAdmin = (req, res, next) => {
    console.log("User Role:", req.session.user ? req.session.user.role : "No user data");
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins only." });
    }
};


// Admin route (example)
app.get('/admin', isAdmin, (req, res) => {
    res.render('admin');  // Render your admin.ejs page
});

app.get('/admin', authController.authenticate, isAdmin, (req, res) => {
    res.send('Welcome to the admin dashboard');
});



app.post('/signup', upload.single('image'), authController.signup);


//Ensure isLoggedIn middleware is used to protect routes that require authentication
const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        return res.send(`
            <script>
                alert("Please log in or sign up before using this feature.");
                window.location.href = "/login";
            </script>
        `);
    }
    if (req.session.user.role === 'admin') {
        return res.redirect('/admin');
    }
    next();
};


app.get('/logout', (req, res) => {
    console.log('Logout route hit'); // Debugging
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Could not log out. Please try again.');
        }
        res.redirect('/login');
    });
});

//Login route
app.post('/login', usersController.login);



// User profile routes
app.get('/profile', isLoggedIn, usersController.getProfile); // View profile // View profile
app.post('/profile', isLoggedIn, upload.single('image'), usersController.updateProfile); // Update profile

// User-specific routes
app.get('/user', isLoggedIn, (req, res) => {
    res.render('user', { user: req.session.user });
});


// Product routes
app.get('/products/clothes', productsController.getAllClothes);
app.get('/products/clothes/:id', productsController.getClothingById);
app.get('/products/vinyls', productsController.getAllVinyls);
app.get('/products/vinyls/:id', productsController.getVinylById)
app.get('/products/:type/:id', productsController.getProductById);
app.get('/products/whatsnew', productsController.getLatestProducts);
app.post('/products/reviews',isLoggedIn, productsController.addReview);

// Cart routes
app.get('/cart',isLoggedIn, cartController.getUserCarts); // Fetch cart items
app.post('/cart/add', isLoggedIn, cartController.addItemToCart); // Add item to cart
app.post('/cart/:id/delete', cartController.removeItemFromCart); // Remove item
app.post('/cart/:id/update', cartController.updateCartItem); // Update quantity
app.post('/checkout',isLoggedIn, cartController.checkout); // Checkout items


// Render payment page
app.get('/payment', isLoggedIn, cartController.renderPaymentPage);

//NETS QR payment routes
app.post('/generateNETSQR',isLoggedIn, netsQrController.generateQrCode);

app.get("/nets-qr/success",isLoggedIn, (req, res) => {
    res.render('netsTxnSuccessStatus', { message: 'Transaction Successful!' });
});
app.get("/nets-qr/fail",isLoggedIn, (req, res) => {
    res.render('netsTxnFailStatus', { message: 'Transaction Failed. Please try again.' });
})

//Paypal payment routes
app.post('/api/orders',isLoggedIn, paypalController.createOrderHandler);
app.post('/api/orders/:orderID/capture',isLoggedIn, paypalController.captureOrderHandler);

app.get('/invoice/:transactionId',isLoggedIn, transactionController.getInvoice);
app.get('/invoice/:transactionId',isLoggedIn, transactionController.getInvoice);


// Confirm payment
app.post('/payment/confirm', isLoggedIn, cartController.confirmPayment);
app.post('/payment/confirm', isLoggedIn, transactionController.confirmPayment);





//Admin profile routes
app.get('/admin/profile', isAdmin, adminController.getAdminProfile);
app.post('/admin/profile/update', isAdmin, adminController.updateProfile);
// Admin user management routes
app.get('/admin/manageuser', isAdmin, adminController.getAllUsers);

// Admin Clothes
app.get('/admin/manageclothes', isAdmin, adminController.getAdminClothes);

// Admin Vinyls
app.get('/admin/managevinyls', isAdmin, adminController.getAdminVinyls);


// Admin product management routes
app.get('/admin/managewhatsnew', isAdmin, adminController.getWhatsNew);
app.get('/admin/editproduct/:id/:type', isAdmin, adminController.renderEditProductPage);
app.post('/admin/editproduct/:id/:type', isAdmin, upload.single('newImage'), adminController.editProduct);
app.get('/admin/addnewproduct/:type', isAdmin, adminController.renderAddNewProductPage);
app.post('/admin/addnewproduct/:type', isAdmin, upload.single('image'), adminController.addNewProduct);
app.post('/admin/deleteproduct/:id/:type', isAdmin, adminController.deleteProduct);

// Admin transaction management route
app.get('/admin/viewtransactions', isAdmin, adminController.getAllTransactions);

//Admin sales performance route
//app.get('/sales-performance',isAdmin, adminController.getSalesPerformance);

// About and location pages
app.get('/about', usersController.getAbout);
app.get('/location', usersController.getLocation);

// Start server
app.listen(4002, () => {
    console.log('Server is running on http://localhost:4002');
});
