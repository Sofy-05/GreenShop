import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const FeedbackSchema = new Schema({

    autore: {type: SchemaTypes.ObjectId, ref: 'User', required: true},
    negozio: {type: SchemaTypes.ObjectId, ref: 'Negozio', required: true},
    feedback:{type: Boolean, required:true}

});

FeedbackSchema.index({ autore: 1, negozio: 1 }, { unique: true });
//Feedback.createIndex({"autore": 1, "negozio": 1}, {unique: true});
const Feedback = mongoose.model('Feedback', FeedbackSchema);

export default Feedback;