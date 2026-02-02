import express from 'express';
import User from './models/User.js';
import crypto from "crypto";
import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    service: 'gmail', //usiamo gmail come provider
    auth: {
        user: process.env.MAIL, //mia mail (laura) per mandare le mail ai vari utenti
        pass: process.env.PASSWORD_MAIL
    }
})
const router = express.Router(); 


router.post('/register', async function (req, res){
    try{
        console.log(req)
        const {username, password, email, ruolo} = req.body;
        if(!username || !password || !email){
            return res.status(400).json({success: false, message: "campi obbligatori mancanti"});
        }

        const usernameGiaEsistente = await User.findOne(
            {
            username: username
            }).exec();
        
        if(usernameGiaEsistente){
            return res.status(409).json({
                success: false,
                message: "Username gia utilizzato"
            })
        }
        const mailGiaEsistente = await User.findOne(
            {
                email: email
            }
        ).exec();

        if(mailGiaEsistente){
            return res.status(409).json({
                success: false,
                message: "Mail gia presente nel sistema"
            })
        }

        const tokenDiAttivazione = crypto.randomBytes(20).toString('hex');
        const newUser = new User({
            username : username,
            password : password,
            email : email,
            ruolo : ruolo || "utente",
            isActive : false,
            activationToken : tokenDiAttivazione
        });

    try{
        await newUser.save(); //salvo user nel db
    }catch(dberror){
        return res.status(500).json({ success: false, message: "Errore nel salvataggio dati." });
    }
    
    const linkAttivazione = "http://localhost:3000/api/auth/confirm/" + tokenDiAttivazione;
    
    const mail = {
        from: process.env.MAIL,
        to: email,
        subject: 'Verifica il tuo account ShopGreen',
        html: `
        <h3>Benvenuto in ShopGreen!</h3>
        <p>Ciao <b>${req.body.username}</b>,</p>
        <p>Grazie per esserti unito a noi! Per completare la procedura, clicca sul link qui sotto:</p>
        <a href="${linkAttivazione}">Clicca qui per attivare il tuo account</a>
        <br><br>
        <p><small>Se non sei stato tu, ignora questa mail.</small></p>
    `
    };

    try {
        await transporter.sendMail(mail);
        console.log("Email di attivazione inviata a: " + req.body.email);

        return res.json({
            success: true,
            message: "registrazione avvenuta con successo, controlla la mail"
        });
    } catch (error) {
        console.error("Errore nell'invio della mail:", error);
        await User.deleteOne({ _id: newUser._id });
        return res.status(500).json({
                success: false,
                message: "Impossibile inviare l'email di conferma. Riprova più tardi o controlla l'indirizzo email."
            });
    }

    
    }catch(error){
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: "Errore del server" 
        });
    }

    
});
 
//quando l'utente clicckerà il link verra fatta questa chiamata:
router.get('/confirm/:token', async function (req, res) {
    try {
        const tokenRicevuto = req.params.token;

        const user = await User.findOne({
            activationToken: tokenRicevuto
        });

        if (!user) {
            return res.redirect('http://localhost:3001/login#/login');
        }

        user.isActive = true;
        user.activationToken = null;
        await user.save();
        return res.redirect('http://localhost:3001/login#/login');

    } catch (error) {
        console.error("Errore attivazione:", error);
        return res.redirect('http://localhost:3001/login#/login');
    }
});



export default router;