import express from 'express';
import User from './models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router(); //gli arrivano le richieste get, post...

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client( GOOGLE_CLIENT_ID );

async function verify( token ) {
	const ticket = await client.verifyIdToken({
		idToken: token,
		audience: GOOGLE_CLIENT_ID, 
	});
	const payload = ticket.getPayload(); //oggetto di risposta
	return payload;
}

router.post('', async function (req, res) {
    try {
        let user = null; // Usiamo let invece di var ed iniziamo a null

        if (req.body.googleToken) {
            const payload = await verify(req.body.googleToken);
            
            if (!payload) {
                return res.status(400).json({ success: false, message: "Token Google non valido." });
            }

            // Cerchiamo l'utente per email
            user = await User.findOne({ email: payload.email }).exec();

            if (!user) {
                // Se non esiste, lo creiamo
                user = new User({
                    username: payload.email,
                    email: payload.email,
                    password: Math.random().toString(36).slice(-10), // Password randomica sicura
                    ruolo: "utente" // Coerente con il tuo mappingRole
                });
                await user.save(); // SENZA .exec()
                console.log('Nuovo utente Google creato:', payload.email);
            }
        } else {
            // Login standard
            user = await User.findOne({ username: req.body.username }).exec();
            
            if (!user) {
                return res.status(401).json({ success: false, message: "Authentication failed. User not found." });
            }

            if (user.password !== req.body.password) {
                return res.status(401).json({ success: false, message: "Authentication failed. Wrong password." });
            }
        }

        // Generazione Token JWT (Uguale per entrambi i metodi)
        const tokenPayload = {
            username: user.username,
            id: user._id,
            ruolo: user.ruolo
        };

        const token = jwt.sign(tokenPayload, process.env.PRIVATE_KEY, { expiresIn: 86400 });

        res.json({
            success: true,
            message: "success",
            token: token,
            username: user.username,
            id: user._id,
            ruolo: user.ruolo,
            self: "/ShopGreenAPI/1.0.0/" + user._id
        });

    } catch (error) {
        console.error("Errore nel processo di login:", error);
        res.status(500).json({ success: false, message: "Errore interno del server." });
    }
});

export default router;