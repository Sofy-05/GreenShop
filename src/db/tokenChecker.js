//Per DELETE, POST e PUT, dov'è necessario essere loggati per eseguire un'operazione

import jwt from 'jsonwebtoken';

const tokenChecker = function(req, res, next) {
    let token = req.headers['authorization']; 

    if (!token) {
        token = req.headers['x-access-token'];
    }

    if (!token) {
        return res.status(401).send({ 
            success: false,
            titolo: "Unauthorized",
            dettagli: "Token mancante. Utente non autenticato."
        });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.PRIVATE_KEY, function(err, decoded) {        
        if (err) {
            return res.status(403).send({
                success: false,
                titolo: "Forbidden",
                dettagli: "Permessi negati. Il token non è valido o è scaduto."
            });     
        } else {
            req.loggedUser = decoded;
            next();
        }
    });
    
};

export default tokenChecker;