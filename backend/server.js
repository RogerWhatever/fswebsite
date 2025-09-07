// Import necessary modules
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');

// --- Configuration ---
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = 'uploads/';

// --- Setup ---
const app = express();
app.use(express.json()); // For parsing application/json
app.use(cors());

// Setup LowDB file database
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set default collections for the database if they don't exist
db.defaults({ users: [], files: [] }).write();

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- Middleware for JWT Authentication ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;
        next();
    });
};

// Helper function to check if user is admin
const isAdmin = (email) => {
    return email === 'admin@gmail.com';
};

// --- API Endpoints ---

// User Registration (with admin support)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = db.get('users').find({ email }).value();
    if (existingUser) {
        return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword };
    db.get('users').push(newUser).write();

    // Special message for admin registration
    const message = email === 'admin@gmail.com' ? 
        'Admin account created successfully!' : 
        'Registration successful!';

    res.status(201).json({ message });
});

// User Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const user = db.get('users').find({ email }).value();
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful!', token, user: { name: user.name, email: user.email } });
});

// Get all files (public for viewing)
app.get('/api/files', (req, res) => {
    try {
        const files = db.get('files').value();
        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Failed to fetch files' });
    }
});

// File Upload (protected route with admin check for syllabus)
app.post('/api/files/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { title, description, subjectId, unit } = req.body;
    
    // Check if this is a syllabus upload (unit 0) and user is admin
    if (parseInt(unit) === 0 && !isAdmin(req.user.email)) {
        return res.status(403).json({ message: 'Only ADMIN can upload syllabus files.' });
    }
    
    const newFile = {
        id: Date.now(),
        title,
        description,
        subjectId: parseInt(subjectId),
        unit: parseInt(unit),
        uploadedBy: req.user.email,
        filename: req.file.filename,
        path: req.file.path,
        date: new Date().toISOString()
    };

    db.get('files').push(newFile).write();

    res.status(201).json({ message: 'File uploaded successfully!', file: newFile });
});

// Delete file (admin can delete any file, users can delete their own files)
app.delete('/api/files/:id', authenticateToken, (req, res) => {
    console.log('DELETE request received for file ID:', req.params.id); // Debug log
    
    const fileId = parseInt(req.params.id);
    
    // Find the file in the database
    const file = db.get('files').find({ id: fileId }).value();
    
    if (!file) {
        console.log('File not found with ID:', fileId); // Debug log
        return res.status(404).json({ message: 'File not found.' });
    }
    
    // Check if user is admin OR if user owns the file
    const canDelete = isAdmin(req.user.email) || file.uploadedBy === req.user.email;
    
    if (!canDelete) {
        return res.status(403).json({ message: 'You can only delete your own files.' });
    }
    
    try {
        // Delete the physical file from the filesystem
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log('Physical file deleted:', file.path); // Debug log
        }
        
        // Remove the file record from the database
        db.get('files').remove({ id: fileId }).write();
        console.log('File record removed from database'); // Debug log
        
        res.json({ message: 'File deleted successfully!' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Failed to delete file.' });
    }
});

// New endpoint to serve files with authentication check for downloads
app.get('/api/download/:filename', authenticateToken, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ message: 'File not found.' });
    }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('POST /api/register');
    console.log('POST /api/login');
    console.log('GET /api/files');
    console.log('POST /api/files/upload');
    console.log('DELETE /api/files/:id');
});
