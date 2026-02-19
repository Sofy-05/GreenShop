import { describe, beforeAll, jest, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Feedback from './models/Feedback'; 

const BASE_URL = '/api/feedback';
const JWT_SECRET = process.env.PRIVATE_KEY;

const IDUtente = '6996e91163ade9c90df7bc57';
const IDNegozio = '699443846b30cbd91bbcb4c8';
const FakeIDNegozio = new mongoose.Types.ObjectId();
const FakeIDUtente = new mongoose.Types.ObjectId();

let tokenUtente;
let expiredToken;

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
    
        expiredToken = jwt.sign(
            {
                id: IDUtente,
                email: 'utente@test.com',
                ruolo: 'utente'
            },
            JWT_SECRET,
            { expiresIn: 0 }
        );
});

describe('GET `/feedback`', () => {

    test('Se la ricerca ha successo, restituisce 200 e il feedback trovato', async () => {

        const response = await request(app)
            .get(BASE_URL)
            .query({ negozio_id: IDNegozio }) 
            .set('Authorization', 'Bearer ' + tokenUtente);

        expect(response.status).toBe(200);
        expect(response.body.successo).toBe(true); 
        expect(response.body.feedback).toBeInstanceOf(Array);
        
        response.body.feedback.forEach((f) => {
            expect(f).toHaveProperty('feedback');
        });
    });

    test('Se manca l\'id del negozio nella query, restituisce 400 e un messaggio di errore', async () => {
        const response = await request(app)
            .get(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenUtente);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            titolo: "Bad Request",
            dettagli: "Manca l'id del negozio"
        });
    });

    test('Se non esiste feedback per l\'utente e il negozio, restituisce 404 e un messaggio di errore', async () => {

        const response = await request(app)
            .get(BASE_URL)
            .query({ negozio_id: FakeIDNegozio.toString() })
            .set('Authorization', 'Bearer ' + tokenUtente);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: true,
            titolo: "Not Found",
            dettagli: "Non è presente alcun feedback associato a questi user e negozio"
        });
    });

    test('Se il token è scaduto, restituisce 401 e un messaggio di errore', async () => {
        const response = await request(app)
            .get(BASE_URL)
            .query({ negozio_id: IDNegozio })
            .set('Authorization', 'Bearer ' + expiredToken);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            titolo: "Unauthorized",
            dettagli: "Token scaduto. Effettua nuovamente il login."
        });
    });

    test('Se il token è scaduto, restituisce 403 e un messaggio di errore', async () => {
        const response = await request(app)
            .get(BASE_URL)
            .query({ negozio_id: IDNegozio })
            .set('Authorization', 'Bearer ' + FakeIDUtente);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            success: false,
            titolo: "Forbidden",
            dettagli: "Permessi negati. Il token non è valido."
        });
    });

    test('Se il server fallisce (Errore DB), restituisce 500 e un messaggio di errore', async () => {
        const findSpy = jest.spyOn(Feedback, 'find').mockReturnValue({
            select: jest.fn().mockRejectedValue(new Error('DB Error'))
        });

        const response = await request(app)
            .get(BASE_URL)
            .query({ negozio_id: IDNegozio })
            .set('Authorization', 'Bearer ' + tokenUtente);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false, 
            titolo: "Internal Server Error", 
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        })

        findSpy.mockRestore();
    });

});

describe('POST `/feedback`', () => {

    const payloadValido = {
        negozio: IDNegozio,
        feedback: true
    };

    test('Se la creazione ha successo, restituisce 201 e i conteggi dei feedback', async () => {
        await Feedback.deleteOne({ autore: IDUtente, negozio: IDNegozio });

        const response = await request(app)
            .post(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenUtente)
            .send(payloadValido);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            success: true,
            positive: expect.any(Number),
            negative: expect.any(Number)
        });
        
        const creato = await Feedback.findOne({ autore: IDUtente, negozio: IDNegozio });
        expect(creato).toBeDefined();
    });

    test('Se l\'utente ha già inviato un feedback, restituisce 409 e un messaggio di errore', async () => {
        // Ci assicuriamo che esista già un feedback
        const esistente = await Feedback.findOne({ autore: IDUtente, negozio: IDNegozio });
        if (!esistente) {
            await new Feedback({ autore: IDUtente, negozio: IDNegozio, feedback: true }).save();
        }

        const response = await request(app)
            .post(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenUtente)
            .send(payloadValido);

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: true,
                titolo: "Feedback già presente",
                dettagli: "Non è possibile inviare un feedback poiché uno è già stato inviato"
        });
    });

    test('Se il token è scaduto, restituisce 401 e un messaggio di errore', async () => {
        const response = await request(app)
            .post(BASE_URL)
            .set('Authorization', 'Bearer ' + expiredToken)
            .send({ negozio: IDNegozio, feedback: true });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            titolo: "Unauthorized",
            dettagli: "Token scaduto. Effettua nuovamente il login."
        });
    });

    test('Se il token non fornisce i permessi richiesti, restituisce 403 e un messaggio di errore', async () => {
        const response = await request(app)
            .post(BASE_URL)
            .set('Authorization', 'Bearer ' + FakeIDUtente)
            .send({ negozio: IDNegozio, feedback: true });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            success: false,
            titolo: "Forbidden",
            dettagli: "Permessi negati. Il token non è valido."
        });
    });

    test('Se il server fallisce nel connettersi al DB, restituisce 500 e un messaggio di errore', async () => {
        // Mock del metodo save del prototipo di Feedback
        const mockSave = jest.spyOn(Feedback.prototype, 'save')
            .mockRejectedValue(new Error('Errore DB'));

        const response = await request(app)
            .post(BASE_URL)
            .set('Authorization', 'Bearer ' + tokenUtente)
            .send({
                negozio: new mongoose.Types.ObjectId(),
                feedback: false
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false, 
            titolo: "Internal Server Error", 
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });

        mockSave.mockRestore();
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});