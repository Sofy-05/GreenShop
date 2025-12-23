import express from 'express';
import User from './models/User.js';
import tokenChecker from './tokenChecker.js';
const router = express.Router();

// spero che nel tocken checker vengano gestiti anche i casi di errore 401 e 403 :)
router.use(tokenChecker);

router.get('/:user_id', tokenChecker, async (req, res) => { //testata, funziona
    try{
        const idDaUrl = req.params.user_id; //id preso dall'URL
        const idDalToken = req.loggedUser.id; //id preso dall'utente che sta effettuando la GET

        if (idDaUrl !== idDalToken) { //se un utente cerca di visualizzare i preferiti di un altro utente
            return res.status(403).json({
                success: false,
                titolo: "Unauthorized",
                dettagli: "Non puoi visualizzare i preferiti di un altro utente"
            });
        }

        const userTrovato = await User.findById(idDaUrl).select('preferitiNegozi').populate('preferitiNegozi', 'nome'); // .find() usa ciò che gli viene passato per consultare il database

        if (!userTrovato) {
            return res.status(404).json({
                success: false,
                titolo: "Not Found",
                dettagli: "L'id specificato non corrisponde ad alcun utente"
            });
        }

        res.status(200).json(userTrovato.preferitiNegozi); // restituisco un messaggio di conferma e la lista degli user trovati (deve essere uno user perché cercato per id)
    }
    catch (err)
    {
        console.error("Errore nella ricerca dei preferiti: ", err);
        res.status(500).json({success: false, titolo: "Internal Server Error", dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    }
});

router.post('/:user_id', tokenChecker, async (req, res) => { //testata, funziona 
    try{ //gestione del successo
        
        const idDaUrl = req.params.user_id; //id preso dall'URL
        const idDalToken = req.loggedUser.id; //id preso dall'utente che sta effettuando la POST

        if (idDaUrl !== idDalToken) { //se un utente cerca di modificare i preferiti di un altro utente
            return res.status(403).json({
                success: false,
                titolo: "Unauthorized",
                dettagli: "Non puoi modificare i preferiti di un altro utente"
            });
        }

        const idNegozio = req.body.negozio_id;

        const utenteAggiornato = await User.findByIdAndUpdate(
            idDaUrl,
            { $addToSet: { preferitiNegozi: idNegozio } }, // $addToSet aggiunge solo se l'ID non esiste già (evita duplicati)
            { new: true } // Restituisce il documento aggiornato invece di quello vecchio
        );

        if (!utenteAggiornato) {
            return res.status(404).json({
                success: false,
                titolo: "Not Found",
                dettagli: "L'id utente non esiste nel database"
            });
        }

        console.log('Negozio aggiunto ai preferiti');

        res.status(201).json({success: true});
    }
    catch(err)
    { //gestione errori definiti nelle API
        console.error("Errore nella aggiunta del negozio: ", err);
        res.status(500).json({success: false, titolo: "Internal Server Error", dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    } 
});

router.delete('/:user_id', tokenChecker, async (req, res) => {  //testata, funziona  
    try{ //gestione del successo
        const idDaUrl = req.params.user_id; //id preso dall'URL
        const idDalToken = req.loggedUser.id; //id preso dall'utente che sta effettuando la DELETE

        if (idDaUrl !== idDalToken) { //se un utente cerca di modificare i preferiti di un altro utente
            return res.status(403).json({
                success: false,
                titolo: "Unauthorized",
                dettagli: "Non puoi modificare i preferiti di un altro utente"
            });
        }

        const idNegozio = req.query.negozio_id;

        if (!idNegozio) {
            return res.status(400).json({
                success: false,
                titolo: "Bad Request",
                dettagli: "Manca l'id del negozio da rimuovere dai preferiti"
            });
        }

        const utenteAggiornato = await User.findByIdAndUpdate(
            idDaUrl,
            { $pull: { preferitiNegozi: idNegozio } }, // $addToSet aggiunge solo se l'ID non esiste già (evita duplicati)
            { new: true } // Restituisce il documento aggiornato invece di quello vecchio
        );

        if (!utenteAggiornato) {
            return res.status(404).json({ 
                success: false, 
                titolo: "Not Found", 
                dettagli: "Non è possibile trovare e quindi rimuovere il negozio dalla lista dei preferiti"});
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

export default router;