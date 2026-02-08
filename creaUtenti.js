import mongoose from 'mongoose';
import User from './src/db/models/User.js';
import Ecommerce from './src/db/models/Ecommerce.js';

//mongoose.connect('mongodb://127.0.0.1:27017/ShopGreen') 
mongoose.connect('mongodb+srv://anna_luvisotto:Anna2005.@anna.pcl2dby.mongodb.net/?appName=Anna') 
    .then(() => console.log("Connesso a MongoDB"))
    .catch(err => console.error("Errore connessione:", err));

const creaDati = async () => {
    try {
        await User.deleteMany({});
        const utentiTest = [
            {
                username: "anna",
                email: "anna@test.com",
                password: "anna", 
                ruolo: "operatore"
            },
            {
                username: "sofia",
                email: "sofia@test.com",
                password: "sofia",
                ruolo: "utente"
            }
        ];

        await User.insertMany(utentiTest);
        console.log("Utenti Anna e Sofia creati con successo!");

        const userSofia = await User.findOne({ username: "sofia" });
        if (!userSofia) {
            throw new Error("Errore: Sofia non è stata salvata correttamente!");
        }

        const shopSofia = new Ecommerce({
            User: userSofia._id,
            Categorie: ["vestiario"], 
            Zone: ["Gardolo", "Povo"], 
            Links: ["https://sofia.com"],
            Info: "Vendo i miei vestiti che non indosso più"
        });

        await shopSofia.save();
        console.log("E-Commerce di Sofia creato e collegato con successo!");

    } catch (error) {
        console.error("Errore durante la creazione:", error.message);
    } finally {
        mongoose.connection.close();
    }
};

creaDati();