import express from 'express';
import Ecommerce from './models/Ecommerce.js';

const router = express.Router();

router.get('', async (req,res) => {
    try{
        const filtro = {}
        const filtroZona = req.query.Zone
        const filtroCategoria = req.query.Categorie
        if(filtroZona)
            filtro.Zone = filtroZona
        if(filtroCategoria)
            filtro.Categorie = filtroCategoria
        
        const venditoriTrovati = await Ecommerce.find(filtro).populate('User','username');

        res.status(200).json(venditoriTrovati);
    }
    catch(err){
        console.error("Errore nella visualizzazione dei venditori: ", err);
        res.status(500).json({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        })
    }
});

router.get('/:eshop_id', async (req,res) => {
    try{
        const eshopId = req.params.eshop_id
        const eshop = await Ecommerce.findById(eshopId).populate('User','username'); //deve popolare user per quando facciamo le richieste del nome dello user

        res.status(200).json(eshop);
    }
    catch(err){
        console.error("Errore nella visualizzazione del venditore: ", err);
        res.status(500).json({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        })
    }
});

export default router;