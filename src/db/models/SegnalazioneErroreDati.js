import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const SegnalazioneSchema = new Schema({
    autore: {type: SchemaTypes.ObjectId, ref: 'User', required: true},
    negozio: {type: SchemaTypes.ObjectId, ref: 'Negozio', required: true},
    motivo: {type: String, enum: ["attività chiusa", "mancato rispetto sostenibilità", "dati errati", "altro"], required: true},
    specificaMotivo: {type: String, required: function() { return (this.motivo === 'dati errati' || this.motivo === "altro")}},
    stato: {type: String, enum: ["nuova", "in verifica", "risolta"], default: "nuova"} //per gestione per operatori
});

const Segnalazione = mongoose.model('Segnalazione', SegnalazioneSchema);

export default Segnalazione;