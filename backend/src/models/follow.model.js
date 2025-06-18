import mongoose from 'mongoose';

// Follow Model - for tracking user relationships
const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Ensure unique follow relationships
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Notification Model
const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'follow', 
            'like_post', 
            'event_invite', 
            'event_rsvp', 
            'new_event_nearby',
            'message'
        ],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    relatedEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

export const Follow = mongoose.model('Follow', followSchema);
export const Notification = mongoose.model('Notification', notificationSchema);