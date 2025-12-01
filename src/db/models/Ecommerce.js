import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;

const ECommerceSchema = new Schema({
    User: {type: [Schema.Types.ObjectId], ref: 'User'},
    Categorie: { type: [String], enum: ["cura della casa e della persona", "alimenti", "vestiario"], required: true},
    Zone: {type: [String],enum: [
        "Meano",
        "Gardolo",
        "Argentario",
        "Centro Storico Piedicastello",
        "Bondone",
        "San Giuseppe Santa Chiara",
        "Sardagna",
        "Povo",
        "Oltrefersina",
        "Ravina-Romagnano",
        "Villazzano",
        "Mattarello"
    ],required: true}, 
    Links: {type: [String], trim: true},
    Info: {type: String}
})

const ECommerce = mongoose.model('ECommerce', ECommerceSchema);

export default ECommerce;