import { describe, beforeAll, jest, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import mongoose from 'mongoose';
import Ecommerce from './models/Ecommerce';

const BASE_URL = '/api/ecommerce';

const IDEcommerce = '6996fc016b30cbd91bbcb51f'; 
const FakeIDEcommerce = new mongoose.Types.ObjectId();

beforeAll(async () => {
    jest.setTimeout(10000);
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.DB_URI);
    }
});

describe('GET `/ecommerce`', () => {

    test('Se la ricerca ha successo, restituisce 200 e un array di venditori', async () => {
        const response = await request(app)
            .get(BASE_URL);

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);

        if (response.body.length > 0) {
            response.body.forEach((venditore) => {
                expect(venditore).toMatchObject({
                    _id: expect.any(String),
                    User: expect.any(Object),
                    Zone: expect.any(Array),
                    Categorie: expect.any(Array),
                    Links: expect.any(Array)
                });
            });
        }
    });

    test('Se filtrato per zona, restituisce 200 e i venditori corrispondenti', async () => {
        const zonaTest = 'Gardolo';
        const response = await request(app)
            .get(BASE_URL)
            .query({ Zone: zonaTest });

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        
        response.body.forEach(v => {
            expect(v.Zone).toContain(zonaTest);
        });
    });

    test('Se il server fallisce (Errore DB), restituisce 500 e un messaggio di errore', async () => {
        const mockFind = jest.spyOn(Ecommerce, 'find').mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('Errore DB'))
        });

        const response = await request(app).get(BASE_URL);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nello stabilire una connessione con il database"
        });

        mockFind.mockRestore();
    });
});

describe('GET `/ecommerce/{ecommerce_id}`', () => {

    test('Se la richiesta ha successo, restituisce 200 e i dettagli del venditore', async () => {
        const response = await request(app)
            .get(`${BASE_URL}/${IDEcommerce}`);

        if (response.status === 200) {
            expect(response.body._id).toBe(IDEcommerce);
            expect(response.body).toHaveProperty('User');
            expect(response.body.User).toHaveProperty('username');
        }
    });

    test('Se il server fallisce nella ricerca per ID, restituisce 500 e un messaggio di errore', async () => {
        const mockFindId = jest.spyOn(Ecommerce, 'findById').mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('Errore DB'))
        });

        const response = await request(app).get(`${BASE_URL}/${IDEcommerce}`);

        expect(response.status).toBe(500);
        expect(response.body.titolo).toBe("Internal Server Error");

        mockFindId.mockRestore();
    });

    test('Se l\'ID è valido ma il venditore non esiste, restituisce 404', async () => {
        const idInesistente = new mongoose.Types.ObjectId();
        const response = await request(app).get(`${BASE_URL}/${idInesistente}`);
        
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            titolo: "Not Found",
            dettagli: "Venditore ecommerce non trovato"
        });
    });

    test('Se l\'ID ha un formato non valido, restituisce 400', async () => {
        const idSbagliato = "id-non-valido"; 
        const response = await request(app).get(`${BASE_URL}/${idSbagliato}`);
        
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            titolo: "Bad Request",
            dettagli: "L'ID fornito non è valido"
        });
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});