import express from 'express';
import Feedback from './models/Feedback.js';
import tokenChecker from './tokenChecker.js';
const router = express.Router();

// spero che nel tocken checker vengano gestiti anche i casi di errore 401 e 403 :)
router.use(tokenChecker);

router.get('', async (req, res) => {
    try{
        //const userId = req.loggedUser.id;
        const filtro = {};
        const userId = req.query.user;
        const negozioId = req.body.negozio;

        if (negozioId)
        {
            filtro.autore = userId;
            filtro.negozio = negozioId;
        }
            
        const feedbackTrovato = await Feedback.find(filtro).select('feedback') // .find() usa ciò che gli viene passato per consultare il database
        if (!feedbackTrovato || feedbackTrovato.length === 0) {
            return res.status(404).json({
                success: true,
                titolo: "Feedback non trovato",
                dettagli: "Non è presente alcun feedback associato a questi user e negozio"
            });
        }

        res.status(200).json({successo: true, feedback: feedbackTrovato}); // restituisco un messaggio di conferma e la lista degli user trovati (deve essere uno user perché cercato per id)
    }
    catch (err)
    {
        console.error("Errore: ", err);
        res.status(500).json({success: false, titolo: "Internal Server Error", dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    }
});

router.post('', async (req, res) => {    
    try{ //gestione del successo
        //const idUtente = req.loggedUser.id;
        const idUtente = req.query.user; // ID dell'utente (chi sta salvando il preferito)
        const idNegozio = req.body.idNegozio; // ID del negozio preso dal corpo della POST

        //controllo che non esista già un feedback per questo user a questo negozio
        const filtro = {};
        filtro.autore = idUtente;
        filtro.negozio = idNegozio;
        const feedbackTrovato = await Feedback.find(filtro)
        if (feedbackTrovato || feedbackTrovato.length > 0) {
            return res.status(409).json({
                success: true,
                titolo: "Feedback già presente",
                dettagli: "Non è possibile inviare un feedback poiché uno è già stato inviato"
            });
        }

        let feedback = new Feedback({
            //campi obbligatori
            autore: idUtente,
            negozio: idNegozio,
            feedback: req.body.feedback
        });

        feedback = await feedback.save();
        let feedbackId = feedback.Id_;

        console.log('Feedback inviato con successo');

        const filtro1 = {};
        filtro1.negozio = idNegozio;
        filtro1.feedback = true;

        const filtro2 = {};
        filtro2.negozio = idNegozio;
        filtro2.feedback = false;
        const feedbackPositivi = await Feedback.countDocuments(filtro1);
        const feedbackNegativi = await Feedback.countDocuments(filtro2);
        res.location("/api/feedback" + feedbackId).status(201).json({success: true, positive: feedbackPositivi, negative: feedbackNegativi});
    }
    catch(err)
    { //gestione errori definiti nelle API
        console.error("Errore nell'invio del feedback: ", err);
        res.status(500).json({success: false, titolo: "Internal Server Error", dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    } 
});
