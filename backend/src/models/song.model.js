import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    artist: {
        type: String,
        required: true,
        trim: true
    },
    album: {
        type: String,
        default: "",
        trim: true
    },
    externalId: {
        spotify: String,
        apple: String,
        youtube: String
    },
    previewUrl: {
        type: String,
        default: ""
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    totalVotes: {
        type: Number,
        default: 0
    },
    dailyVotes: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
songSchema.index({ title: 1, artist: 1 }, { unique: true });
songSchema.index({ submittedBy: 1 });
songSchema.index({ totalVotes: -1 });
songSchema.index({ dailyVotes: -1 });
songSchema.index({ createdAt: -1 });

const Song = mongoose.model('Song', songSchema);
export default Song;