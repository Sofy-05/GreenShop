import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const MessaggioSchema = new Schema({
    mittente: {type: SchemaTypes.ObjectId, ref: 'User',  required: true},
    tipo: {type: String, enum: ["Promozione", "NotificaDiSistema"], required: true},
    destinatario: { type: SchemaTypes.ObjectId, ref: 'User', required: true},
    titolo: {type: String, required: true},
    testo: {type: String, required: true},
    immagine: {type: String, required: false},
    letto: {type: Boolean, default: false }
})

const Messaggio = mongoose.model('Messaggioaaa', MessaggioSchema);

export default Messaggio;