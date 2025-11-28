import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const SlotOrariSchema = new Schema({
    apertura: { type: String, required: true }, 
    chiusura: { type: String, required: true }  
});

const OrariGiorno = new Schema({
    chiuso: {type: Boolean, default: false},
    slot:{type: [SlotOrariSchema], required: true}
});

const NegozioSchema = new Schema({
    nome: {type : String, required: true},
    categoria: { type: [String], enum: ["cura della casa e della persona", "alimenti", "vestiario"], required: true},
    orari: {
        lunedi: OrariGiorno,
        martedi: OrariGiorno,
        mercoledi: OrariGiorno,
        giovedi: OrariGiorno,
        venerdi: OrariGiorno,
        sabato: OrariGiorno,
        domenica: OrariGiorno
    },
    linkSito: {type: String, required: false},
    maps: {type: String, required: false, trim: true}, //trim serve per togliere eventuali spazi lasciati erroneamente nell'inserimento del link
    mappe: {type: String, required: false, trim: true},
    licenza: {type : String, required: true},
    verificato: {type: Boolean, default:false}
})

const Negozio = mongoose.model('Negozio', NegozioSchema);

export default Negozio;