import express from 'express';
import mongoose from 'mongoose';
import authRouter from './src/db/authentication.js';
import registerRouter from './src/db/register.js';
import negoziRouter from './src/db/negozi.js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware per leggere i JSON
app.use(express.json());

//Middleware per leggere gli HTML (Aggiunto)
app.use(express.urlencoded({ extended: true }));

app.use(cors());
// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

// Collegamento route: tutte le richieste che iniziano con /api vanno al tuo router
app.use('/api', authRouter);
app.use('/api',registerRouter);
app.use('/api/negozi', negoziRouter);
//----------------------------- parte aggiunta per collegare il nuovo file html

import path from 'path';
import { fileURLToPath } from 'url';

// Per risolvere il problema di __dirname in moduli ES (necessario per res.sendFile)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route per la radice /
app.get('/', (req, res) => {
    // Invia il file HTML che si trova nella cartella 'public'
    res.sendFile(path.join(__dirname, 'public', 'loginCredenzialiGoogle.html'));
});

//-----------------------------

// Connessione DB
//mongoose.connect(process.env.DB_URI || 'mongodb://127.0.0.1:27017/ShopGreen')
mongoose.connect(process.env.DB_URI || 'mongodb+srv://anna_luvisotto:Anna2005.@anna.pcl2dby.mongodb.net/?appName=Anna')
    .then(() => {
        console.log('--- MongoDB Connesso ---');
        app.listen(PORT, () => {
            console.log(`Server attivo su http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error('Errore DB:', err));