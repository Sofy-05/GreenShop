import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const userSchema = new Schema({

    username: {type : String, required: true, unique: true},
    email: {type : String, required: true, unique: true},
    googleId: {type: String, unique: true, sparse: true }, //è undefined se non fa accesso con google, sparse serve per mantenere anche questo unico ma con possibilità di essere null per più persone
    password: {type : String, required: function(){
        return !this.googleId;
    }},
    ruolo: {type : String, enum : ["Operatore", "Utente", "Venditore"], required : true},
    profile_picture: {type : String, required: false, default: "images/avatar-default.svg"},
    preferiti:{ type: [SchemaTypes.ObjectId], ref: 'Negozio'},
    impostazioni: {
        lingua: {type: String, enum: ["it", "en", "de"], default: "it" },
        tema: {type: String, enum: ["chiaro", "scuro"], default: "chiaro" },
        notificheMail: {type: Boolean, default: true}
    },
    negozioAssociato: {type: SchemaTypes.ObjectId, ref: 'Negozio', required: function(){ 
        return (this.ruolo === 'Venditore')
    }}
});

const User = mongoose.model('User', userSchema);

export default User;