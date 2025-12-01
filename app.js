
import express from 'express';
import mongoose from 'mongoose';
import authRouter from './src/db/authentication.js'; // Nota il percorso verso src
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware per leggere i JSON
app.use(express.json());

app.use(cors());
// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

// Collegamento route: tutte le richieste che iniziano con /api vanno al tuo router
app.use('/api', authRouter);

// Connessione DB
mongoose.connect(process.env.DB_URI || 'mongodb://127.0.0.1:27017/ShopGreen')
    .then(() => {
        console.log('--- MongoDB Connesso ---');
        app.listen(PORT, () => {
            console.log(`Server attivo su http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error('Errore DB:', err));