import { describe, beforeAll, jest, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import mongoose from 'mongoose';
import User from './models/User';

describe('POST `/auth/login`', () => {
    beforeAll(async ()=>{
        jest.setTimeout(10000);
        await mongoose.connect(process.env.DB_URI);
    });
    const validUsername = 'test';
    const validPassword = 'password';
    const invalidUsername = "wrongUsername"
    const invalidPassword = "wrongPassword"
    const ruoli_aspettati =  ["operatore", "utente", "venditore"];

    test('Se username e password sono corrette, restituisce 200, il token e le informazioni dell \'utente', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({username:validUsername, password: validPassword});
        expect(response.status).toBe(200);
         expect(response.body).toEqual({
            success: true,
            titolo: expect.any(String),
            dettagli: expect.any(String),
            token: expect.any(String),
            username: validUsername,
            id: expect.any(String),
            ruolo: expect.any(String),
            self: expect.any(String),
        });
        expect(ruoli_aspettati).toContain(response.body.ruolo);
    })

    test('Se lo username non è presente, restituisce 400 e un messaggio di errore', async() => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({password: validPassword});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            titolo: "Bad Request",
            dettagli: "Username e/o password mancanti."
        });
    })

    test('Se la password non è presente, restituisce 400 e un messaggio di errore', async() => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({username: validUsername});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            titolo: "Bad Request",
            dettagli: "Username e/o password mancanti."
        });
    })

     test('Se lo username non è corretto (ovvero l\'utnete non viene trovato), restituisce 401 e un messaggio di errore', async() => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({username: invalidUsername, password:validPassword});
        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            titolo: "Unauthorized",
            dettagli: "Autenticazione fallita. Utente non trovato."
        });
    })
    
    test('Se la password è errata, restituisce 401 e un messaggio di errore', async() => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({username: validUsername, password:invalidPassword});
        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            titolo: "Unauthorized",
            dettagli: "Autenticazione fallita. Password errata." 
        });
    })

    test('Se il server fallisce nel stabilire una connessione con il database, restituisce 500 e un messaggio di errore', async () => {
    
    const mockFindOne = jest.spyOn(User, 'findOne').mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Errore DB'))
    });

    const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'password' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
            success: false,
            titolo: "Internal Server Error",
            dettagli: "Il server fallisce nel stabilire una connessione con il database" 
        });
    

    mockFindOne.mockRestore();
});

    afterAll(async () => {
        await mongoose.connection.close(); 
    });
})