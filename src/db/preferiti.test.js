import { describe, beforeAll, afterAll, test, expect, jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

const BASE_URL = '/api/preferiti/users';
const JWT_SECRET = process.env.PRIVATE_KEY;

const IDUtente = '6996e81863ade9c90df7bc56';
const IDVenditore = '6996e93f63ade9c90df7bc58';
const FakeIDUtente = new mongoose.Types.ObjectId();
const IDNegozio = '6983d1b934c432f08e9f8a23';

let tokenUtente;
let tokenVenditore;
let expiredToken;
let tokenUtenteFake;

beforeAll(async () => {
    jest.setTimeout(10000);
    await mongoose.connect(process.env.DB_URI);

    tokenUtente = jwt.sign(
        {
            id: IDUtente,
            email: 'utente@test.com',
            ruolo: 'utente'
        },
        JWT_SECRET,
        { expiresIn: 86400 }
    );

    tokenVenditore = jwt.sign(
        {
            id: IDVenditore,
            email: 'venditore@test.com',
            ruolo: 'venditore'
        },
        JWT_SECRET,
        { expiresIn: 86400 }
    );

    expiredToken = jwt.sign(
        {
            id: IDUtente,
            email: 'utente@test.com',
            ruolo: 'utente'
        },
        JWT_SECRET,
        { expiresIn: 0 }
    );

    tokenUtenteFake = jwt.sign(
        {
            id: FakeIDUtente,
            username: "fakeUser",
            ruolo: "utente"
        },
        JWT_SECRET,
        { expiresIn: 86400 }
    );
});

describe('GET /preferiti/users/{user_id}', () => {

    test('Se la richiesta ha successo, restituisce 200 e l’array dei preferiti', async () => {

        const response = await request(app)
            .get(`${BASE_URL}/${IDUtente}`)
            .set('Authorization', 'Bearer ' + tokenUtente);

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);

        response.body.forEach((negozio) => {
            expect(negozio).toMatchObject({
                _id: expect.any(String),
                nome: expect.any(String),
                coordinate: expect.any(Array),
                sostenibilitàVerificata: expect.any(Boolean),
                orari: expect.any(Object)
            });
        });
    });

    test('Se un utente prova a vedere i preferiti di un altro utente, restituisce 403 e un messaggio di errore', async () => {

        const response = await request(app)
            .get(`${BASE_URL}/${IDUtente}`)
            .set('Authorization', 'Bearer ' + tokenVenditore);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            success: false,
            titolo: "Forbidden",
            dettagli: "Non puoi visualizzare i preferiti di un altro utente"
        });
    });

    test('Se il token non è valido o è scaduto, restituisce 401 e un messaggio di errore', async () => {

        const response = await request(app)
            .get(`${BASE_URL}/${IDUtente}`)
            .set('Authorization', 'Bearer ' + expiredToken);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            titolo: "Unauthorized",
            dettagli: "Token scaduto. Effettua nuovamente il login."
        });
    });

    test('Se l’utente non esiste, restituisce 404 e un messaggio di errore', async () => {

        const response = await request(app)
            .get(`${BASE_URL}/${FakeIDUtente}`)
            .set('Authorization', 'Bearer ' + jwt.sign(
                { id: FakeIDUtente, ruolo: 'utente' },
                JWT_SECRET,
                { expiresIn: 86400 }
            ));

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            titolo: "Not Found",
            dettagli: "Utente non trovato"
        });
    });

    test('Se il server fallisce nel connettersi al DB, restituisce 500 e un messaggio di errore', async () => {

        const mockFind = jest
            .spyOn(User, 'findById')
            .mockReturnValue({
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockRejectedValue(new Error('Errore DB'))
        });

        const response = await request(app)
            .get(`${BASE_URL}/${IDUtente}`)
            .set('Authorization', 'Bearer ' + tokenUtente);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });

        mockFind.mockRestore();
    });

});

describe('POST /preferiti/users/{user_id}', () => {

    test('Se il token non è valido o è scaduto, restituisce 401 e un messaggio di errore', async () => {

        const response = await request(app)
            .post(`${BASE_URL}/${IDUtente}`)
            .set('Authorization', 'Bearer ' + expiredToken)
            .send({ negozio_id: IDNegozio });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            titolo: "Unauthorized",
            dettagli: "Token scaduto. Effettua nuovamente il login."
        });
    });

    test('Se il token non fornisce i permessi richiesti, restituisce 403 e un messaggio di errore', async () => {

        const response = await request(app)
            .post(`${BASE_URL}/${IDVenditore}`)
            .set('Authorization', 'Bearer ' + tokenUtente)
            .send({ negozio_id: IDNegozio });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            success: false,
            titolo: "Forbidden",
            dettagli: "Non puoi modificare i preferiti di un altro utente"
        });
    });

    test('Se l’utente non esiste, restituisce 404 e un messaggio di errore', async () => {

        jest.spyOn(User, 'findById').mockResolvedValue(null);

        const response = await request(app)
            .post(`${BASE_URL}/${FakeIDUtente}`)
            .set('Authorization', 'Bearer ' + tokenUtenteFake)
            .send({ negozio_id: IDNegozio });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            titolo: "Not Found",
            dettagli: "Utente non trovato"
        });

        User.findById.mockRestore();
    });

    test('Se il negozio viene aggiunto, restituisce 201 e success: true', async () => {

        const response = await request(app)
            .post(`${BASE_URL}/${IDUtente}`)
            .set('Authorization', 'Bearer ' + tokenUtente)
            .send({ negozio_id: IDNegozio });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            success: true
        });
    });

    test('Se il server fallisce nel connettersi al DB, restituisce 500 e un messaggio di errore', async () => {

        jest.spyOn(User, 'findByIdAndUpdate')
            .mockRejectedValue(new Error('Errore DB'));

        const response = await request(app)
            .post(`${BASE_URL}/${IDUtente}`)
            .set('Authorization', 'Bearer ' + tokenUtente)
            .send({ negozio_id: IDNegozio });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false, 
            titolo: "Internal Server Error", 
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });

        User.findByIdAndUpdate.mockRestore();
    });

    afterAll(async () => {
        await User.findByIdAndUpdate(
            IDUtente,
            { $pull: { preferitiNegozi: IDNegozio } },
            { new: true }
        );
    });
});

describe('DELETE /preferiti/users/{user_id}', () => {

    afterAll(async () => {
        await User.findByIdAndUpdate(
            IDUtente,
            { $addToSet: { preferitiNegozi: IDNegozio } },
            { new: true }
        );
    });

    test('Se il negozio viene rimosso correttamente, restituisce 204', async () => {

        const response = await request(app)
            .delete(`${BASE_URL}/${IDUtente}`)
            .query({ negozio_id: IDNegozio })
            .set('Authorization', 'Bearer ' + tokenUtente);

        expect(response.status).toBe(204);
        expect(response.body).toEqual({});
    });

    test('Se manca negozio_id nella query, restituisce 400', async () => {
        const response = await request(app)
            .delete(`${BASE_URL}/${IDUtente}`)
            .set('Authorization', 'Bearer ' + tokenUtente);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            titolo: "Bad Request",
            dettagli: "Manca l'id del negozio da rimuovere dai preferiti"
        });
    });

    test('Se il token non è valido o è scaduto, restituisce 401 e un messaggio di errore', async () => {
        const response = await request(app)
            .delete(`${BASE_URL}/${IDUtente}`)
            .query({ negozio_id: IDNegozio })
            .set('Authorization', 'Bearer ' + expiredToken);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            titolo: "Unauthorized",
            dettagli: "Token scaduto. Effettua nuovamente il login."
        });
    });

    test('Se un utente prova a modificare i preferiti di un altro utente, restituisce 403 e un messaggio di errore', async () => {
        const response = await request(app)
            .delete(`${BASE_URL}/${IDUtente}`)
            .query({ negozio_id: IDNegozio })
            .set('Authorization', 'Bearer ' + tokenVenditore);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            success: false,
            titolo: "Forbidden",
            dettagli: "Non puoi modificare i preferiti di un altro utente"
        });
    });

    test('Se l’utente non esiste nel DB, restituisce 404 e un messaggio di errore', async () => {

        jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(null);

        const response = await request(app)
            .delete(`${BASE_URL}/${FakeIDUtente}`)
            .query({ negozio_id: IDNegozio })
            .set('Authorization', 'Bearer ' + tokenUtenteFake);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            titolo: "Not Found",
            dettagli: "Non è possibile trovare e quindi rimuovere il negozio dalla lista dei preferiti"
        });

        User.findByIdAndUpdate.mockRestore();
    });

    test('Se il server fallisce nel connettersi al DB, restituisce 500 e un messaggio di errore', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockRejectedValue(new Error('Errore DB'));

        const response = await request(app)
            .delete(`${BASE_URL}/${IDUtente}`)
            .query({ negozio_id: IDNegozio })
            .set('Authorization', 'Bearer ' + tokenUtente);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });

        User.findByIdAndUpdate.mockRestore();
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});
