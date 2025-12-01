import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const RecensioneSchema = new Schema({
    autore: {type: SchemaTypes.ObjectId, ref: 'User', required: true},
    negozio: {type: SchemaTypes.ObjectId, ref: 'Negozio', required: true},
    recensione: {type: String, required: true, maxlength: 500}
});

const Recensione = mongoose.model('Recensione', RecensioneSchema);

export default Recensione;