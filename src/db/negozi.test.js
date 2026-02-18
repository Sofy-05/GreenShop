import { describe, beforeAll, jest, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Negozio from './models/Negozio';


const BASE_URL = '/api/negozi';
const JWT_SECRET =  process.env.PRIVATE_KEY;

const IDNegozio = '699443846b30cbd91bbcb4c8'; 
const IDProprietario = '699447b46b30cbd91bbcb4d5'; 
const IDUtente = '699388546b30cbd91bbcb4c3'; 
const IDOperatore = '6994bc556b30cbd91bbcb4dd';
const IDNegozioNonVerificato = '6994b6806b30cbd91bbcb4da';

let tokenUtenteGenerico;
let tokenProprietario;
let tokenOperatore;

beforeAll(async () => {
    jest.setTimeout(10000);
    await mongoose.connect(process.env.DB_URI);

    // Token per utente (test) 
    tokenUtenteGenerico = jwt.sign({
        id: IDUtente,
        email: 'email@test.com',
        ruolo: 'utente'
    }, JWT_SECRET, { expiresIn: 86400 });

    // Token per venditore proprietario (venditoreTest")
    tokenProprietario = jwt.sign({
        id: IDProprietario,
        email: 'emailVenditore@test.com',
        ruolo: 'venditore' 
    }, JWT_SECRET, { expiresIn: 86400 });

    // Token per operatore 
    tokenOperatore = jwt.sign({
        id: IDOperatore,
        email: 'op@test.com',
        ruolo: 'operatore'
    }, JWT_SECRET, { expiresIn: 86400 });
});

describe('GET `/negozi`', () => {
    
    test('Se la ricerca ha successo, restituisce 200 e un array con i negozi corrispondenti alla ricerca', async () => {
        const response = await request(app)
            .get(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenUtenteGenerico);

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        
        const negozioTrovato = response.body.find(negozio => negozio._id === IDNegozio);
        expect(negozioTrovato).toBeDefined();

        const foundUnverified = response.body.find(negozio => negozio._id === IDNegozioNonVerificato);
        expect(foundUnverified).toBeUndefined();

        response.body.forEach((negozio) => {
        expect(negozio).toMatchObject({
            _id: expect.any(String),
            nome: expect.any(String),
            coordinate: expect.any(Array),   
            categoria: expect.any(Array),     
            linkSito: expect.any(String),     
            sostenibilitàVerificata: expect.any(Boolean),
            verificatoDaOperatore: true,
        });
    });
    });

    test('Se la ricerca ha successo (da operatore), restituisce 200 e un array con i negozi corrispondenti alla ricerca (anche quelli non verificati)', async () => {
        const response = await request(app)
            .get(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenOperatore);
            

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        
        const negozioTrovato = response.body.find(negozio => negozio._id === IDNegozio);
        expect(negozioTrovato).toBeDefined();

        const foundUnverified = response.body.find(negozio => negozio._id === IDNegozioNonVerificato);
        expect(foundUnverified).toBeDefined();

        response.body.forEach((negozio) => {
        expect(negozio).toMatchObject({
            _id: expect.any(String),
            nome: expect.any(String),
            coordinate: expect.any(Array),   
            categoria: expect.any(Array),     
            linkSito: expect.any(String),     
            sostenibilitàVerificata: expect.any(Boolean),
            verificatoDaOperatore: expect.any(Boolean),
        });
    });
    });
});

describe('GET `/negozi/{negozio_id}`', () => {

    test('Se richesta ha successo (da Utente), restituisce 200 e le informazioni relative al negozio/segnalazione selezionato/a', async () => {
        const response = await request(app)
            .get(`${BASE_URL}/${IDNegozio}`)
            .set('Authorization', 'Bearer ' + tokenUtenteGenerico);
        
        expect(response.status).toBe(200);
        
        expect(response.body).toMatchObject({
            _id: IDNegozio,
            nome: "NegozioTest",
            linkSito: "https://test.it",
            sostenibilitàVerificata: true
        });

        expect(response.body.licenzaOppureFoto).toBeUndefined();
        expect(response.body.proprietario).toBeUndefined();
        expect(response.body.verificatoDaOperatore).toBeUndefined();
    });

    test('Se richesta ha successo (da Proprietario), restituisce 200 e le informazioni relative al negozio/segnalazione selezionato/a', async () => {
        const response = await request(app)
            .get(`${BASE_URL}/${IDNegozio}`)
            .set('Authorization', 'Bearer ' + tokenProprietario);
        
        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            _id: IDNegozio,
            nome: "NegozioTest",
            linkSito: "https://test.it",
            sostenibilitàVerificata: true
        });
        
        expect(response.body.licenzaOppureFoto).toBeDefined();
        expect(response.body.proprietario).toBe(IDProprietario);
        expect(response.body.proprietarioInAttesa).toBeUndefined();
    });


    test('Se richesta ha successo (da Operatore), restituisce 200 e le informazioni relative al negozio/segnalazione selezionato/a', async () => {
        const response = await request(app)
            .get(`${BASE_URL}/${IDNegozio}`)
            .set('Authorization', 'Bearer ' + tokenOperatore);
        
        expect(response.body).toMatchObject({
            _id: IDNegozio,
            nome: "NegozioTest",
            linkSito: "https://test.it",
            sostenibilitàVerificata: true
        });

        expect(response.body.licenzaOppureFoto).toBeDefined();
        expect(response.body.verificatoDaOperatore).toBe(true);
        expect(response.body.proprietarioInAttesa).toBe(false);
    });

    test('Se il negozio non viene trovato, restituisce 400 e un messaggio di errore', async () => {
        const fakeID = '000000000000000000000000'; 
        const response = await request(app)
            .get(`${BASE_URL}/${fakeID}`)
            .set('Authorization', 'Bearer ' + tokenUtenteGenerico);
        
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            titolo: "Not Found",
            dettagli: "Negozio non trovato" 
        });
    });
    
    test('Se il server fallisce nel stabilire una connessione con il database, restituisce 500 e un messaggio di errore', async () => {
        const mockFindOne = jest.spyOn(Negozio, 'findOne').mockReturnValue({
                exec: jest.fn().mockRejectedValue(new Error('Errore DB'))
            });

        const response = await request(app)
            .get(`${BASE_URL}/id_non_valido`)
            .set('Authorization', 'Bearer ' + tokenUtenteGenerico);
        
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });

        mockFindOne.mockRestore();
    });
});

describe('POST `/negozi`', () => {

    const payloadValido = {
        nome: "NuovoNegozioTest",
        coordinate: [12.10, 41.20],
        categoria: ["alimenti"],
        sostenibilitàVerificata: false,
        maps: "https://maps.google.com/test",
        linkSito: "https://negozio-test.it",
        licenzaOppureFoto: "licenza.jpg"
    };

    test('Se la creazione ha successo, restituisce 201 e success: true', async () => {
        const response = await request(app)
            .post(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenProprietario)
            .send(payloadValido);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            success: true
        });
    });

    test('Se mancano campi obbligatori, restituisce 400 e un messaggio di errore', async () => {
        const payloadInvalido = {
            nome: "NegozioSenzaCategoria"
        };

        const response = await request(app)
            .post(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenProprietario)
            .send(payloadInvalido);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false, 
            titolo: "Bad Request", 
            dettagli: "Uno o più campi obbligatori mancanti"
        });
    });

    test('Se il server fallisce nel connettersi al DB, restituisce 500 e un messaggio di errore', async () => {

        const mockSave = jest
            .spyOn(Negozio.prototype, 'save')
            .mockRejectedValue(new Error('Errore DB'));

        const response = await request(app)
            .post(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenUtenteGenerico)
            .send(payloadValido);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false, 
                titolo: "Internal Server Error", 
                dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });

        mockSave.mockRestore();
    });

    afterAll(async () => {
        const negozio = await Negozio.findOne({ nome: "NuovoNegozioTest" });
        negozioId = negozio._id.toString();

        const response = await request(app)
            .delete(`${BASE_URL}/${negozioId}`)
            .set('Authorization', 'Bearer ' + tokenOperatore);
    });
});

describe('DELETE `/negozi/{negozio_id}`', () => {

    let negozioDaEliminareId;

    const payloadValido = {
        nome: "NegozioDaEliminare",
        coordinate: [12.10, 55.20],
        categoria: ["alimenti"],
        sostenibilitàVerificata: false,
        maps: "https://maps.google.com/test",
        linkSito: "https://negozio-test.it",
        licenzaOppureFoto: "licenza.jpg",
        verificatoDaOperatore: false
    };

    beforeAll(async () => {
        const response = await request(app)
            .post(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenProprietario)
            .send(payloadValido);

        const negozio = await Negozio.findOne({ nome: "NegozioDaEliminare" });

        negozioDaEliminareId = negozio._id.toString();
    });

    test('Se l’utente non ha i permessi, restituisce 403 e un messaggio di errore', async () => {

        const response = await request(app)
            .delete(`${BASE_URL}/${negozioDaEliminareId}`)
            .set('Authorization', 'Bearer ' + tokenUtenteGenerico);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            success: false, 
            titolo: "Forbidden",
            dettagli: "Questo account non ha i permessi per procedere con l'operazione"
        });
    });

    test('Se il server fallisce nel connettersi al DB, restituisce 500 e un messaggio di errore', async () => {

        const mockDelete = jest
            .spyOn(Negozio, 'deleteOne')
            .mockRejectedValue(new Error('Errore DB'));

        const response = await request(app)
            .delete(`${BASE_URL}/${negozioDaEliminareId}`)
            .set('Authorization', 'Bearer ' + tokenOperatore);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });

        mockDelete.mockRestore();
    });

    test('Se l’operatore elimina il negozio, restituisce 200 e success: true', async () => {

        const response = await request(app)
            .delete(`${BASE_URL}/${negozioDaEliminareId}`)
            .set('Authorization', 'Bearer ' + tokenOperatore);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true
        });

        const negozio = await Negozio.findById(negozioDaEliminareId);
        expect(negozio).toBeNull();
    });

    test('Se il negozio non esiste, restituisce 404 e un messaggio di errore', async () => {

        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .delete(`${BASE_URL}/${fakeId}`)
            .set('Authorization', 'Bearer ' + tokenOperatore);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            titolo: "Not Found",
            dettagli: "Negozio non trovato"
        });
    });
});



afterAll(async () => {
    await mongoose.connection.close();
});