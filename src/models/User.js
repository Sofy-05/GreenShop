import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const userSchema = new Schema({

    username: {type : String, required: true, unique: true},
    email: {type : String, required: true, unique: true},
    password: {type : String, required: true},
    ruolo: { type : String, enum : ["Operatore", "Utente", "venditore"], required : true},
    profile_picture: {type : String, required: false, default: "images/avatar-default.svg"}

});

const User = model('User', userSchema);

export default User;