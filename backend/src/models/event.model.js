import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    creator: {
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
        },
        venue: {
            type: String,
            default: "" // Optional specific venue name
        }
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        default: null // Optional end date for multi-day events
    },
    category: {
        type: String,
        enum: ['social', 'professional', 'educational', 'entertainment', 'sports', 'other'],
        default: 'other'
    },
    attendees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['yes', 'no', 'maybe'],
            default: 'yes'
        },
        rsvpDate: {
            type: Date,
            default: Date.now
        }
    }],
    maxAttendees: {
        type: Number,
        default: null // null = unlimited
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        default: ""
    },
    tags: [{
        type: String,
        maxlength: 20
    }]
}, {
    timestamps: true
});

// Geospatial index for location-based queries
eventSchema.index({ "location.coordinates": "2dsphere" });

// Indexes for efficient queries
eventSchema.index({ creator: 1, createdAt: -1 });
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isPrivate: 1 });

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function() {
    return this.attendees.filter(attendee => attendee.status === 'yes').length;
});

// Method to check if user is attending
eventSchema.methods.isUserAttending = function(userId) {
    const attendee = this.attendees.find(a => a.user.toString() === userId.toString());
    return attendee ? attendee.status : 'no';
};

const Event = mongoose.model('Event', eventSchema);
export default Event;