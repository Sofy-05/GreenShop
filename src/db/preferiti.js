import express from 'express';
import User from './models/User.js';
import tokenChecker from './tokenChecker.js';
const router = express.Router();

router.use(tokenChecker);

router.get('/:user_id', tokenChecker, async (req, res) => { //testata, funziona
    try{
        const idDaUrl = req.params.user_id; //id preso dall'URL
        const idDalToken = req.loggedUser.id; //id preso dall'utente che sta effettuando la GET

        if (idDaUrl !== idDalToken) { //se un utente cerca di visualizzare i preferiti di un altro utente
            return res.status(403).json({
                success: false,
                titolo: "Forbidden",
                dettagli: "Non puoi visualizzare i preferiti di un altro utente"
            });
        }

        const utenteConPreferiti = await User.findById(idDaUrl)
            .select('preferitiNegozi')
            .populate('preferitiNegozi', 'nome orari sostenibilitàVerificata coordinate');

        if (!utenteConPreferiti) {
            return res.status(404).json({
                success: false,
                titolo: "Not Found",
                dettagli: "Utente non trovato"
            });
        }

        res.status(200).json(utenteConPreferiti.preferitiNegozi);
    }
    catch (err)
    {
        console.error("Errore nella visualizzazione dei preferiti: ", err);
        res.status(500).json({
            success: false, 
            titolo: "Internal Server Error", 
            dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    }
});

router.post('/:user_id', tokenChecker, async (req, res) => { //testata, funziona 
    try{ //gestione del successo
        
        const idDaUrl = req.params.user_id; //id preso dall'URL
        const idDalToken = req.loggedUser.id; //id preso dall'utente che sta effettuando la POST

        if (idDaUrl !== idDalToken) { //se un utente cerca di modificare i preferiti di un altro utente
            return res.status(403).json({
                success: false,
                titolo: "Forbidden",
                dettagli: "Non puoi modificare i preferiti di un altro utente"
            });
        }

        const idNegozio = req.body.negozio_id;

        const utenteAggiornato = await User.findByIdAndUpdate(
            idDaUrl,
            { $addToSet: { preferitiNegozi: idNegozio } }, //$addToSet aggiunge solo se l'ID non esiste già (evita duplicati)
            { new: true } //Restituisce il documento aggiornato invece di quello vecchio
        );

        if (!utenteAggiornato) {
            return res.status(404).json({
                success: false,
                titolo: "Not Found",
                dettagli: "Utente non trovato"
            });
        }

        console.log('Negozio aggiunto ai preferiti');

        res.status(201).json({success: true});
    }
    catch(err)
    { //gestione errori definiti nelle API
        console.error("Errore nella aggiunta del negozio: ", err);
        res.status(500).json({
            success: false, 
            titolo: "Internal Server Error", 
            dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    } 
});

router.delete('/:user_id', tokenChecker, async (req, res) => {  //testata, funziona  
    try{ //gestione del successo
        const idDaUrl = req.params.user_id; //id preso dall'URL
        const idDalToken = req.loggedUser.id; //id preso dall'utente che sta effettuando la DELETE

        if (idDaUrl !== idDalToken) { //se un utente cerca di modificare i preferiti di un altro utente
            return res.status(403).json({
                success: false,
                titolo: "Forbidden",
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
            { $pull: { preferitiNegozi: idNegozio } }, //$addToSet aggiunge solo se l'ID non esiste già (evita duplicati)
            { new: true } //Restituisce il documento aggiornato invece di quello vecchio
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
        res.status(500).json({
            success: false, 
            titolo: "Internal Server Error", 
            dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    } 
});

export default router;