//Per GET, dove non è necessario essere loggati per visualizzare una risorsa,
//ma se si è loggati si possono visualizzare info in più

import jwt from 'jsonwebtoken';

const tokenCheckerOptional = function(req, res, next) {
    let token = req.headers['authorization'];

    if (!token) {
        return next();
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.PRIVATE_KEY, function(err, decoded) {        
        if (err) {
            console.log("Token opzionale presente ma non valido: procedo come utente non autenticato");
            return next();    
        } 
        else {
            req.loggedUser = decoded;
            next();
        }
    });
    
};

export default tokenCheckerOptional;