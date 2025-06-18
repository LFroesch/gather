import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxlength: 500
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true
        }
    },
    image: {
        type: String,
        default: ""
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null // Optional reference to an event
    },
    type: {
        type: String,
        enum: ['general', 'event-related', 'announcement'],
        default: 'general'
    }
}, {
    timestamps: true
});

// Geospatial index for location-based queries
postSchema.index({ "location.coordinates": "2dsphere" });

// Index for efficient queries
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ event: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;