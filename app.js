import express from 'express';
import mongoose from 'mongoose';
import authRouter from './src/db/authentication.js';
import registerRouter from './src/db/register.js';
import negoziRouter from './src/db/negozi.js';
import preferitiRouter from './src/db/preferiti.js';
import feedbackRouter from './src/db/feedback.js';
import ecommerceRouter from './src/db/ecommerce.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const corsOptions = {
    origin: [
        'http://localhost:5173',   
        'http://localhost:3001',      
        'http://localhost:4173',
        'https://shopgreen-frontend.onrender.com' 
    ], 
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.static('public'));

app.use('/api/auth', authRouter);
app.use('/api/auth', registerRouter);
app.use('/api/negozi', negoziRouter);
app.use('/api/preferiti/users', preferitiRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/ecommerce', ecommerceRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log('--- MongoDB Connesso ---');
        app.listen(PORT, () => {
            console.log(`Server attivo su http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Errore di connessione al DB:', err);
        process.exit(1); 
    });