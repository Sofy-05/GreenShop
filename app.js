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
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(express.static('public'));

app.use('/api/auth', authRouter);
app.use('/api/auth', registerRouter);
app.use('/api/negozi', negoziRouter);
app.use('/api/preferiti/users', preferitiRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/ecommerce', ecommerceRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//mongoose.connect(process.env.DB_URI || 'mongodb://127.0.0.1:27017/ShopGreen')
mongoose.connect(process.env.DB_URI || 'mongodb+srv://anna_luvisotto:Anna2005.@anna.pcl2dby.mongodb.net/?appName=Anna')
    .then(() => {
        console.log('--- MongoDB Connesso ---');
        app.listen(PORT, () => {
            console.log(`Server attivo su http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error('Errore DB:', err));