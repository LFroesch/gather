import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  options: [{
    text: { type: String, required: true, trim: true, maxlength: 100 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    city: { type: String },
    state: { type: String },
    country: { type: String },
    coordinates: { type: [Number] } // [lng, lat]
  },
  category: {
    type: String,
    enum: ['recommendations', 'opinion', 'planning', 'fun', 'general'],
    default: 'general'
  },
  placeName: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

pollSchema.index({ expiresAt: 1 });
pollSchema.index({ creator: 1 });
pollSchema.index({ createdAt: -1 });
pollSchema.index({ status: 1 });
pollSchema.index({ "location.coordinates": "2dsphere" });

const Poll = mongoose.model('Poll', pollSchema);
export default Poll;
