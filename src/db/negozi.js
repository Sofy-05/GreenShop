import express from 'express';
import Negozio from './models/Negozio.js'; 
import tokenChecker from './tokenChecker.js';
const router = express.Router();

//req.query per query params
//req.params.nomedelparam per path params

router.get('', async (req, res) => {
    const filtro = {}
    const filtroNome = req.query.nome //filtro per nome (req.query si usa per i query parameters)
    const filtroCategoria = req.query.categoria //filtro per categoria
    const filtroVerificato = req.query.verificatoDaOperatore //filtro per mappa o sezione segnalazioni
    if(filtroNome)
        filtro.nome = new RegExp(filtroNome, 'i');
    if(filtroCategoria)
        filtro.categoria = filtroCategoria
    if(filtroVerificato)
        filtro.verificatoDaOperatore = filtroVerificato
    
    const negoziTrovati = await Negozio.find(filtro);

    res.status(200).json(negoziTrovati);
});

router.get('/:id', async(req, res) => {
    const id = req.params.id
    const negozioInfo = await Negozio.findById(id)
    if(!negozioInfo){
        
    }
});




//router.post('', tokenChecker, async (req,res) => {
router.post('', async (req,res) => {    
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
            
            //proprietario: req.loggedUser.id || null
            proprietario: null

        });
        
        negozio = await negozio.save();
        
        let negozioId = negozio._id;

        console.log('Negozio creato con successo');

        res.location("/api/negozi" + negozioId).status(201).send();
    }
    catch(err){ //gestione errori definiti nelle API
        console.error("Errore nella creazione del negozio: ", err);

        if(err.name == "Bad Request"){
            res.status(400).json({ 
                success: false, 
                titolo: "Uno o più campi obbligatori mancanti", 
                dettagli: err.message 
            });
        }
        else if(err.name == "Internal Server Error"){
            res.status(500).json({ 
                success: false, 
                titolo: "Connessione con il database fallita", 
                dettagli: err.message 
            });
        }
    }
    
});



export default router;