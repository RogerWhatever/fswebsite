// Import necessary modules
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Import models
const User = require('./models/User');
const File = require('./models/File');

// --- Configuration ---
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- Setup ---
const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.error('MongoDB connection error:', error));

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Multer with Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'edushare-files',
        allowed_formats: ['pdf', 'doc', 'docx', 'xlsx', 'pptx', 'txt'],
        resource_type: 'raw'
    },
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// --- Middleware for JWT Authentication ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
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

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        // Create new user
        const user = new User({ name, email, password });
        await user.save();

        const message = email === 'admin@gmail.com' ? 
            'Admin account created successfully!' : 
            'Registration successful!';

        res.status(201).json({ message });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and check password
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({ 
            message: 'Login successful!', 
            token, 
            user: { name: user.name, email: user.email } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
});

// Get all files
app.get('/api/files', async (req, res) => {
    try {
        const files = await File.find().sort({ createdAt: -1 });
        
        // Transform for frontend compatibility
        const transformedFiles = files.map(file => ({
            id: file._id,
            title: file.title,
            description: file.description,
            subjectId: file.subjectId,
            unit: file.unit,
            uploadedBy: file.uploadedBy,
            filename: file.filename,
            path: file.fileUrl,
            date: file.createdAt
        }));
        
        res.json(transformedFiles);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Failed to fetch files' });
    }
});

// File Upload
app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const { title, description, subjectId, unit } = req.body;
        
        // Check if this is a syllabus upload (unit 0) and user is admin
        if (parseInt(unit) === 0 && !isAdmin(req.user.email)) {
            // Delete uploaded file from Cloudinary if user is not admin
            await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' });
            return res.status(403).json({ message: 'Only admin@gmail.com can upload syllabus files.' });
        }
        
        const newFile = new File({
            title,
            description,
            subjectId: parseInt(subjectId),
            unit: parseInt(unit),
            uploadedBy: req.user.email,
            filename: req.file.originalname,
            cloudinaryId: req.file.filename,
            fileUrl: req.file.path,
            fileSize: req.file.bytes,
            mimeType: req.file.mimetype
        });

        await newFile.save();
        res.status(201).json({ message: 'File uploaded successfully!', file: newFile });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'File upload failed. Please try again.' });
    }
});

// Delete file
app.delete('/api/files/:id', authenticateToken, async (req, res) => {
    try {
        const fileId = req.params.id;
        
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }
        
        // Check if user is admin OR if user owns the file
        const canDelete = isAdmin(req.user.email) || file.uploadedBy === req.user.email;
        
        if (!canDelete) {
            return res.status(403).json({ message: 'You can only delete your own files.' });
        }
        
        // Delete file from Cloudinary
        await cloudinary.uploader.destroy(file.cloudinaryId, { resource_type: 'raw' });
        
        // Delete file record from database
        await File.findByIdAndDelete(fileId);
        
        res.json({ message: 'File deleted successfully!' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Failed to delete file.' });
    }
});

// Download endpoint (redirect to Cloudinary URL)
app.get('/api/download/:filename', authenticateToken, async (req, res) => {
    try {
        const filename = req.params.filename;
        const file = await File.findOne({ filename });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }
        
        // Redirect to Cloudinary URL for download
        res.redirect(file.fileUrl);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Download failed.' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
    console.log('GET /api/download/:filename');
});
