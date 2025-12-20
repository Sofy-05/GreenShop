import express from 'express';
import User from './models/User.js';
import tokenChecker from './tokenChecker.js';
const router = express.Router();

// spero che nel tocken checker vengano gestiti anche i casi di errore 401 e 403 :)
router.use(tokenChecker);

router.get('', async (req, res) => {
    try{
        //const userId = req.loggedUser.id;
        const userId = req.query.user;

        const userTrovati = await User.findById(userId).select('preferitiNegozi'); // .find() usa ciò che gli viene passato per consultare il database

        res.status(200).json(userTrovati); // restituisco un messaggio di conferma e la lista degli user trovati (deve essere uno user perché cercato per id)
    }
    catch (err)
    {
        console.error("Errore nella ricerca dei preferiti: ", err);
        res.status(500).json({success: false, titolo: "Internal Server Error", dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    }
});

router.post('', async (req, res) => {    
    try{ //gestione del successo
        //const idUtente = req.loggedUser.id;
        const idUtente = req.query.user; // ID dell'utente (chi sta salvando il preferito)
        const idNegozio = req.body.idNegozio; // ID del negozio preso dal corpo della POST

        const utenteAggiornato = await User.findByIdAndUpdate(
            idUtente,
            { $addToSet: { preferitiNegozi: idNegozio } }, // $addToSet aggiunge solo se l'ID non esiste già (evita duplicati)
            { new: true } // Restituisce il documento aggiornato invece di quello vecchio
        );

        console.log('Negozio aggiunto ai preferiti');

        res.status(201).json({success: true});
    }
    catch(err)
    { //gestione errori definiti nelle API
        console.error("Errore nella aggiunta del negozio: ", err);
        res.status(500).json({success: false, titolo: "Internal Server Error", dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    } 
});

router.delete('', async (req, res) => {    
    try{ //gestione del successo
        //const idUtente = req.loggedUser.id;
        const idUtente = req.query.user; // ID dell'utente (chi sta salvando il preferito)
        const idNegozio = req.body.idNegozio; // ID del negozio preso dal corpo della POST

        const utenteAggiornato = await User.findByIdAndUpdate(
            idUtente,
            { $pull: { preferitiNegozi: idNegozio } }, // $addToSet aggiunge solo se l'ID non esiste già (evita duplicati)
            { new: true } // Restituisce il documento aggiornato invece di quello vecchio
        );

        if (!utenteAggiornato) {
            return res.status(404).json({ success: false, titolo: "Negozio non trovato per questo Utente", dettagli: "Non è possibile trovare e quindi rimuovere il negozio dalla lista dei preferiti"});
        }

        console.log('Negozio rimosso dai preferiti');

        res.status(204).send();
    }
    catch(err)
    { //gestione errori definiti nelle API
        console.error("Errore nella rimozione del negozio: ", err);
        res.status(500).json({success: false, titolo: "Internal Server Error", dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    } 
});