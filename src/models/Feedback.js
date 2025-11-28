import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const FeedbackSchema = new Schema({
    
    negozio: {type: SchemaTypes.ObjectId, ref: 'Negozio', required: true},
    feedback:{type: Boolean, required:true}
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);

export default Feedback;