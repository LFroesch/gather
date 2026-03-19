import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        maxlength: 500
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentType: {
        type: String,
        enum: ['post', 'event'],
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    isDemo: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

commentSchema.index({ parentType: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
