import express from 'express';
import Feedback from './models/Feedback.js';
import Negozio from './models/Negozio.js';
import User from './models/User.js';
import tokenChecker from './tokenChecker.js';

const router = express.Router();

// spero che nel tocken checker vengano gestiti anche i casi di errore 401 e 403 :)
router.use(tokenChecker);

router.get('', async (req, res) => { //testata, funziona
    try{
        const userId = req.loggedUser.id;
        const negozioId = req.query.negozio_id;
        
        if(!negozioId){
            return res.status(400).json({
                success: false,
                titolo: "Bad Request",
                dettagli: "Manca l'id del negozio"
            });
        }
        
        const filtro = {};

        if (negozioId){
            filtro.autore = userId;
            filtro.negozio = negozioId;
        }
            
        const feedbackTrovato = await Feedback.find(filtro).select('feedback') // .find() usa ciò che gli viene passato per consultare il database
        
        if (!feedbackTrovato || feedbackTrovato.length === 0) {
            return res.status(404).json({
                success: true,
                titolo: "Not Found",
                dettagli: "Non è presente alcun feedback associato a questi user e negozio"
            });
        }

        res.status(200).json({
            successo: true, 
            feedback: feedbackTrovato
        }); // restituisco un messaggio di conferma
    }
    catch (err){
        console.error("Errore: ", err);
        res.status(500).json({
            success: false, 
            titolo: "Internal Server Error", 
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        })
    }
});

router.post('', async (req, res) => { //testata, funziona 
    try{ //gestione del successo
        const userId = req.loggedUser.id;
        const negozioId = req.body.negozio;
        const voto = req.body.feedback;

        //controllo che non esista già un feedback per questo user a questo negozio
        const filtro = {};
        filtro.autore = userId;
        filtro.negozio = negozioId;
        const feedbackTrovato = await Feedback.findOne(filtro)
        if (feedbackTrovato) {
            return res.status(409).json({
                success: true,
                titolo: "Feedback già presente",
                dettagli: "Non è possibile inviare un feedback poiché uno è già stato inviato"
            });
        }

        let feedback = new Feedback({
            //campi obbligatori
            autore: userId,
            negozio: negozioId,
            feedback: voto
        });

        feedback = await feedback.save();
        let feedbackId = feedback._id;

        console.log('Feedback inviato con successo');

        //logica del conteggio dei feedback
        const filtro1 = {};
        filtro1.negozio = negozioId;
        filtro1.feedback = true;

        const filtro2 = {};
        filtro2.negozio = negozioId;
        filtro2.feedback = false;
        const feedbackPositivi = await Feedback.countDocuments(filtro1);
        const feedbackNegativi = await Feedback.countDocuments(filtro2);
        
        //Il conteggio dei voti positivi è arrivato a 8, si passa a sostenibilitàVerificata=true
        if(feedbackPositivi >= 8){
            await Negozio.findByIdAndUpdate(negozioId,{sostenibilitàVerificata: true});
            await Feedback.deleteMany({negozio: negozioId});
            console.log("Il negozio ha raggiunto 8 feedback positivi, la sostenibilità è verificata")
        }
        
        //il conteggio dei voti negativi è arrivato a 8, il negozio viene eliminato e l'eventuale proprietario viene dissociato
        else if(feedbackNegativi >= 8){
            const negozioDaEliminare = await Negozio.findById(negozioId);
            if(negozioDaEliminare){
                if(negozioDaEliminare.proprietario)
                    await User.findByIdAndUpdate(negozioDaEliminare.proprietario, {ruolo: 'utente'});
            }
            await Negozio.findByIdAndDelete(negozioId);
            await Feedback.deleteMany({negozio: negozioId});
            console.log("Il negozio ha raggiunto 8 feedback negativi, è stato eliminato")
        }

        res.location("/api/feedback/" + feedbackId).status(201).json({success: true, positive: feedbackPositivi, negative: feedbackNegativi});
    }
    catch(err)
    { //gestione errori definiti nelle API
        console.error("Errore nell'invio del feedback: ", err);
        res.status(500).json({success: false, titolo: "Internal Server Error", dettagli: "Il server fallisce nello stabilire una connessione con il database"})
    } 
});

export default router;