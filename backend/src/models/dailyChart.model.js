import mongoose from 'mongoose';

const dailyChartSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    songs: [{
        songId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song',
            required: true
        },
        votes: {
            type: Number,
            required: true,
            default: 0
        },
        rank: {
            type: Number,
            required: true
        },
        previousRank: {
            type: Number,
            default: null
        }
    }],
    totalVotes: {
        type: Number,
        default: 0
    },
    uniqueVoters: {
        type: Number,
        default: 0
    },
    isFinalized: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
dailyChartSchema.index({ date: -1 });
dailyChartSchema.index({ "songs.songId": 1 });
dailyChartSchema.index({ "songs.votes": -1 });

const DailyChart = mongoose.model('DailyChart', dailyChartSchema);
export default DailyChart;