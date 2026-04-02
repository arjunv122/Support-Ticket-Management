const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide an organization name'],
        trim: true,
        unique: true
    },
    domain: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Organization', organizationSchema);
