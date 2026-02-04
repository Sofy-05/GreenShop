import express from 'express';
import Negozio from './models/Negozio.js'; 
import User from './models/User.js';
import tokenChecker from './tokenChecker.js';
import tokenCheckerOptional from './tokenCheckerOptional.js';
const router = express.Router();

//req.query per query params
//req.params.nomedelparam per path params

router.get('', async (req, res) => { //testata, funziona
    try{
        const filtro = {}
        const filtroNome = req.query.nome //filtro per nome (req.query si usa per i query parameters)
        const filtroCategoria = req.query.categoria //filtro per categoria
        const filtroVerificato = req.query.verificatoDaOperatore //filtro per mappa o sezione segnalazioni
        if(filtroNome)
            filtro.nome = new RegExp(filtroNome, 'i');
        if(filtroCategoria)
            filtro.categoria = filtroCategoria
        if (filtroVerificato) {
            if (filtroVerificato === 'false') {
                // Se l'operatore cerca le "Notifiche" (cose da verificare),
                // gli diamo sia i negozi nuovi (false) SIA quelli con richieste in attesa.
                filtro.$or = [
                    { verificatoDaOperatore: false },
                    { proprietarioInAttesa: { $ne: null } } // $ne significa "Not Equal" (diverso da null)
                ];
            } else {
                // Se cerca quelli verificati (true), comportamento standard
                filtro.verificatoDaOperatore = filtroVerificato;
            }
        }
        
        const negoziTrovati = await Negozio.find(filtro);

        res.status(200).json(negoziTrovati);
    }
    catch(err){
        console.error("Errore nella visualizzazione dei negozi: ", err);
        res.status(500).json({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        })
    }
});

router.get('/:negozio_id', tokenCheckerOptional, async(req, res) => { //testata, funziona
    try{
        const id = req.params.negozio_id
        const negozio = await Negozio.findById(id).lean() //.lean() serve per rimuovere alcuni campi dal body di risposta

        if(!negozio){
            res.status(404).json({
                success: false,
                titolo: "Not Found",
                dettagli: "Negozio non trovato"
            })
        }

        let isOperatore = false;
        let isVenditore = false;

        if(req.loggedUser) {
            isOperatore = req.loggedUser.ruolo === 'operatore';
            isVenditore = negozio.proprietario && (negozio.proprietario.toString() === req.loggedUser.id); //controllo se l'utente è proprietario di tale negozio
        }
        if (!isOperatore && !isVenditore) {
            delete negozio.licenzaOppureFoto;
            delete negozio.verificatoDaOperatore;
        }
        if(!isOperatore && isVenditore)
            delete negozio.verificatoDaOperatore

        res.status(200).json(negozio);
        //Il frontend userà req.loggedUser (o il token) per decidere se mostrare il pulsante "Aggiungi ai preferiti"
    }
    catch (err) {
        console.error("Errore nella visualizzazione dei dettagli di un negozio o segnalazione: ", err);
        res.status(500).json({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        })
    }

});

router.post('', tokenChecker, async (req,res) => { //testata, funziona
    try{ //gestione del successo
        
        let negozio = new Negozio({
            //campi obbligatori
            nome: req.body.nome,
            licenzaOppureFoto: req.body.licenzaOppureFoto,
            categoria: req.body.categoria,
            
            //campi impostati di default
            sostenibilitàVerificata: false,
            verificatoDaOperatore: false,
            
            //campi opzionali
            maps: req.body.maps,
            mappe: req.body.mappe,
            linkSito: req.body.linkSito,
            orari: req.body.orari,
            coordinate: req.body.coordinate,
            
            proprietario: null, //questo campo viene eventualmente riempito solo quando l'operatore approva la richiesta
            proprietarioInAttesa: req.body.proprietario ? req.loggedUser.id : null
        });
        
        negozio = await negozio.save();
        
        let negozioId = negozio._id;

        res.location("/api/negozi/" + negozioId)  
            .status(201)                            
            .json({                                
                success: true
            });
    }
    catch(err){ //gestione errori definiti nelle API
        console.error("Errore nella creazione del negozio: ", err);
        if(err.name == "Bad Request"){
            res.status(400).json({ 
                success: false, 
                titolo: "Bad Request", 
                dettagli: "Uno o più campi obbligatori mancanti"
            });
        }
        else if(err.name == "Internal Server Error"){
            res.status(500).json({ 
                success: false, 
                titolo: "Internal Server Error", 
                dettagli: "Il server fallisce nello stabilire una connessione con il database"
            });
        }
    }
});

router.delete('/:negozio_id', tokenChecker, async(req, res) => { //testata, funziona
    try{
        const id = req.params.negozio_id
        const negozio = await Negozio.findById(id)

        if(!negozio){
            res.status(404).json({
                success: false,
                titolo: "Not Found",
                dettagli: "Negozio non trovato"
            })
        }

        let isOperatore = req.loggedUser.ruolo === 'operatore';
        let isVenditore = negozio.proprietario && (negozio.proprietario.toString() === req.loggedUser.id);

        if(!isOperatore && !isVenditore){ //Ha una funzione diversa rispetto al 403 del tokenChecker
            return res.status(403).json({
                    success: false, 
                    titolo: "Unauthorized",
                    dettagli: "Questo account non ha i permessi per procedere con l'operazione"
            });
        }

        await Negozio.deleteOne({ _id: id });

        console.log("Negozio eliminato con successo")
        res.status(200).json({
                success: true
        });
    }
    catch (err){
        console.error("Errore cancellazione negozio: ", err);
        res.status(500).json({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });

    }
});

router.put('/:negozio_id', tokenChecker, async (req, res) => {
    try {
        const negozioId = req.params.negozio_id;
        const negozioEsistente = await Negozio.findById(negozioId);

        if (!negozioEsistente) {
            return res.status(404).json({ success: false, dettagli: "Negozio non trovato" });
        }

        const isOperatore = req.loggedUser.ruolo === 'operatore';
        const isProprietario = negozioEsistente.proprietario && 
                               negozioEsistente.proprietario.toString() === req.loggedUser.id;

        const isRivendicazione = !negozioEsistente.proprietario && 
                                 req.body.proprietario === req.loggedUser.id;

        if (!isOperatore && !isProprietario && !isRivendicazione) {
            return res.status(403).json({
                success: false,
                dettagli: "Non hai i permessi per modificare questa attività"
            });
        }

        let datiDaAggiornare = {
            nome: req.body.nome,
            categoria: req.body.categoria,
            linkSito: req.body.linkSito,
            orari: req.body.orari,
            licenzaOppureFoto: req.body.licenzaOppureFoto,
            descrizione: req.body.descrizione,
            maps: req.body.maps,
            mappe: req.body.mappe,
        };
        
        if (isOperatore) {
            if (req.body.proprietario) {
                datiDaAggiornare.proprietario = req.body.proprietario; 
                datiDaAggiornare.proprietarioInAttesa = null;
                datiDaAggiornare.verificatoDaOperatore = true; 
                
                const user = await User.findById(req.body.proprietario);
                if (user && user.ruolo === 'utente') {
                    user.ruolo = 'venditore';
                    await user.save();
                    console.log(`Utente ${user.username} promosso a venditore.`);
                }
            } else {
                if (req.body.verificatoDaOperatore !== undefined) {
                    datiDaAggiornare.verificatoDaOperatore = req.body.verificatoDaOperatore;
                }
            }
        } else if (isRivendicazione) {
            datiDaAggiornare.proprietarioInAttesa = req.loggedUser.id; 
            delete datiDaAggiornare.proprietario; 
            delete datiDaAggiornare.verificatoDaOperatore;
        }

        const negozioModificato = await Negozio.findByIdAndUpdate(
            negozioId,
            datiDaAggiornare,
            { new: true, runValidators: true }
        );

        res.status(200).json(negozioModificato);

    } catch (err) {
        console.error("Errore modifica negozio: ", err);
        if (err.name == 'ValidationError') {
            res.status(400).json({
                success: false,
                titolo: "Bad Request",
                dettagli: "Campi non validi o mancanti"
            });
        } else {
            res.status(500).json({
                success: false,
                titolo: "Internal Server Error",
                dettagli: "Errore del server durante l'aggiornamento"
            });
        }
    }
});

export default router;