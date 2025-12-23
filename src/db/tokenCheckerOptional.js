//Per GET, dove non è necessario essere loggati per visualizzare una risorsa,
//ma se si è loggati si possono visualizzare info in più

import jwt from 'jsonwebtoken';

const tokenCheckerOptional = function(req, res, next) {
    var token = req.headers['autenticazione'];

    // CASO 1: Non c'è il token
    if (!token)
        return next();

    // CASO 2: C'è il token e proviamo a leggerlo
    jwt.verify(token, process.env.PRIVATE_KEY, function(err, decoded) {        
        //token non valido
        if (err) {
            console.log("Token presente ma non valido: procedo come utente non autenticato.");
            return next();    
        } 
        //token valido
        else {
            req.loggedUser = decoded;
            next();
        }
    });
    
};

export default tokenCheckerOptional;