// Import necessary modules
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// --- Configuration ---
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const PORT = process.env.PORT || 3000;

// --- Setup ---
const app = express();
app.use(express.json());
app.use(cors());

// In-memory storage (temporary solution)
let users = [];
let files = [];

// Setup Multer for memory storage (since file system doesn't persist)
const storage = multer.memoryStorage();
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

// User Registration (with in-memory storage)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword };
    users.push(newUser);

    // Special message for admin registration
    const message = email === 'admin@gmail.com' ? 
        'Admin account created successfully!' : 
        'Registration successful!';

    res.status(201).json({ message });
});

// User Login (with in-memory storage)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
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

// Get all files (in-memory)
app.get('/api/files', (req, res) => {
    try {
        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Failed to fetch files' });
    }
});

// File Upload (memory storage - files won't persist)
app.post('/api/files/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { title, description, subjectId, unit } = req.body;
    
    // Check if this is a syllabus upload (unit 0) and user is admin
    if (parseInt(unit) === 0 && !isAdmin(req.user.email)) {
        return res.status(403).json({ message: 'Only admin@gmail.com can upload syllabus files.' });
    }
    
    const newFile = {
        id: Date.now(),
        title,
        description,
        subjectId: parseInt(subjectId),
        unit: parseInt(unit),
        uploadedBy: req.user.email,
        filename: req.file.originalname,
        path: `memory/${req.file.originalname}`, // Fake path since file is in memory
        fileData: req.file.buffer, // Store file data in memory
        date: new Date().toISOString()
    };

    files.push(newFile);
    res.status(201).json({ message: 'File uploaded successfully!', file: newFile });
});

// Delete file (in-memory)
app.delete('/api/files/:id', authenticateToken, (req, res) => {
    const fileId = parseInt(req.params.id);
    const fileIndex = files.findIndex(f => f.id === fileId);
    
    if (fileIndex === -1) {
        return res.status(404).json({ message: 'File not found.' });
    }
    
    const file = files[fileIndex];
    const canDelete = isAdmin(req.user.email) || file.uploadedBy === req.user.email;
    
    if (!canDelete) {
        return res.status(403).json({ message: 'You can only delete your own files.' });
    }
    
    files.splice(fileIndex, 1);
    res.json({ message: 'File deleted successfully!' });
});

// Download endpoint (serve from memory)
app.get('/api/download/:filename', authenticateToken, (req, res) => {
    const filename = req.params.filename;
    const file = files.find(f => f.filename === filename);
    
    if (!file || !file.fileData) {
        return res.status(404).json({ message: 'File not found.' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(file.fileData);
});

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
