import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    songId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song',
        required: true
    },
    voteDate: {
        type: Date,
        default: Date.now
    },
    deviceFingerprint: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Ensure one vote per user per day
voteSchema.index({ 
    userId: 1, 
    voteDate: 1 
}, { 
    unique: true,
    partialFilterExpression: {
        voteDate: {
            $gte: new Date(new Date().setHours(0,0,0,0)),
            $lt: new Date(new Date().setHours(23,59,59,999))
        }
    }
});

// Index for efficient queries
voteSchema.index({ songId: 1, voteDate: -1 });
voteSchema.index({ userId: 1, voteDate: -1 });
voteSchema.index({ deviceFingerprint: 1, voteDate: -1 });

const Vote = mongoose.model('Vote', voteSchema);
export default Vote;