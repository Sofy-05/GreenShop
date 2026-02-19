import express from 'express';
import Ecommerce from './models/Ecommerce.js';
import tokenCheckerOptional from './tokenCheckerOptional.js';

const router = express.Router();

router.get('', tokenCheckerOptional, async (req,res) => {
    try{
        const filtro = {}
        const filtroZona = req.query.Zone
        const filtroCategoria = req.query.Categorie
        if(filtroZona)
            filtro.Zone = filtroZona
        if(filtroCategoria)
            filtro.Categorie = filtroCategoria
        
        const venditoriTrovati = await Ecommerce.find(filtro).populate('User','username profile_picture');

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

router.get('/:ecommerce_id', async (req, res) => {
    try {
        const ecommerceId = req.params.ecommerce_id;

        const ecommerce = await Ecommerce.findById(ecommerceId)
            .populate('User', 'username profile_picture');

        if (!ecommerce) {
            return res.status(404).json({
                success: false,
                titolo: "Not Found",
                dettagli: "Venditore ecommerce non trovato"
            });
        }

        res.status(200).json(ecommerce);
    } catch (err) {
        console.error("Errore nella visualizzazione dei dettagli del venditore: ", err);

        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                titolo: "Bad Request",
                dettagli: "L'ID fornito non è valido"
            });
        }

        res.status(500).json({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });
    }
});

export default router;