import mongoose from 'mongoose';
import User from './src/db/models/User.js'; // Controlla che il percorso sia giusto!

// 1. Connessione al DB
//mongoose.connect('mongodb://127.0.0.1:27017/ShopGreen') 
mongoose.connect('mongodb+srv://anna_luvisotto:Anna2005.@anna.pcl2dby.mongodb.net/?appName=Anna') 
    .then(() => console.log("Connesso a MongoDB"))
    .catch(err => console.error("Errore connessione:", err));

const creaDati = async () => {
    try {
        // 2. Definisci gli utenti di test
        // Nota: metto la password in chiaro perché nel tuo codice di login 
        // la confronti direttamente (user.password != req.body.password)
        await User.deleteMany({});
        const utentiTest = [
            {
                username: "anna",
                email: "anna@test.com",
                password: "anna", 
                ruolo: "operatore"
            }
        ];

        // 3. Inserisci nel DB
        await User.insertMany(utentiTest);
        console.log("Utenti creati con successo!");

    } catch (error) {
        console.error("Errore durante la creazione:", error.message);
    } finally {
        // 4. Chiudi la connessione
        mongoose.connection.close();
    }
};

creaDati();