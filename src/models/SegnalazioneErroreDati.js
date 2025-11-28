import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const SegnalazioneSchema = new Schema({
    autore: {type: SchemaTypes.ObjectId, ref: 'User', required: true},
    negozio: {type: SchemaTypes.ObjectId, ref: 'Negozio', required: true},
    motivo: {type: String, enum: ["Attività chiusa", "Mancato rispetto sostenibilità", "Dati errati", "Altro"], required: true},
    specificaMotivo: {type: String, required: function() { return (this.motivo === 'Dati errati' || this.motivo === "Altro")}},
     stato: {type: String, enum: ["Nuova", "In verifica", "Risolta"], default: "Nuova"} //per gestione per operatori
});

const Segnalazione = mongoose.model('Segnalazione', SegnalazioneSchema);

export default Segnalazione;