const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    subjectId: {
        type: Number,
        required: true
    },
    unit: {
        type: Number,
        required: true
    },
    uploadedBy: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    cloudinaryId: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number
    },
    mimeType: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('File', fileSchema);
