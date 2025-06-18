import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    profilePic: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        maxlength: 160,
        default: ""
    },
    locationSettings: {
        searchLocation: {
            city: {
                type: String,
                default: ""
            },
            state: {
                type: String,
                default: ""
            },
            country: {
                type: String,
                default: ""
            },
            coordinates: {
                type: [Number], // [lng, lat]
                default: [0, 0]
            }
        },
        nearMeRadius: {
            type: Number,
            default: 25, // miles
            min: 5,
            max: 100
        },
        autoDetectLocation: {
            type: Boolean,
            default: true
        }
    },
    currentCity: {
        city: {
            type: String,
            default: ""
        },
        state: {
            type: String,
            default: ""
        },
        country: {
            type: String,
            default: ""
        },
        coordinates: {
            type: [Number], // [lng, lat]
            default: [0, 0]
        }
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Create geospatial index for location-based queries
userSchema.index({ "currentCity.coordinates": "2dsphere" });
userSchema.index({ "locationSettings.searchLocation.coordinates": "2dsphere" });

const User = mongoose.model('User', userSchema);
export default User;