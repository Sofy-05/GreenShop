import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

export default mongoose.model("User", new Schema({

    username: {type : String, required: true, unique: true},
    email: {type : String, required: true, unique: true},
    googleId: {type: String, unique: true, sparse: true }, //è undefined se non fa accesso con google, sparse serve per mantenere anche questo unico ma con possibilità di essere null per più persone
    password: {type : String, required: function(){
        return !this.googleId;
    }},
    ruolo: {type : String, enum : ["Operatore", "Utente", "Venditore"], required : true},
    profile_picture: {type : String, required: false, default: "images/avatar-default.svg"},
    preferitiNegozi:{ type: [SchemaTypes.ObjectId], ref: 'Negozio'},
    preferitiECommerce:{ type: [SchemaTypes.ObjectId], ref: 'Ecommerce'},
    impostazioni: {
        lingua: {type: String, enum: ["it", "en", "de"], default: "it" },
        tema: {type: String, enum: ["chiaro", "scuro"], default: "chiaro" },
        notificheMail: {type: Boolean, default: true}
    },
    negozioAssociato: {type: SchemaTypes.ObjectId, ref: 'Negozio', required: function(){ 
        return (this.ruolo === 'Venditore')
    }}
}));