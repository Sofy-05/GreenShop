import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

export default mongoose.model("Messaggio", new Schema({

    mittente: {type: SchemaTypes.ObjectId, ref: 'User',  required: true},
    tipo: {type: String, enum: ["promozione", "notificaDiSistema"], required: true},
    destinatario: { type: SchemaTypes.ObjectId, ref: 'User', required: true},
    titolo: {type: String, required: true},
    testo: {type: String, required: true},
    immagine: {type: String, required: false},
    letto: {type: Boolean, default: false }
}));