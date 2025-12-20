import jwt from 'jsonwebtoken';

const tokenChecker = function(req, res, next) {
	var token = req.headers['autenticazione'];

	if (!token) {
		return res.status(401).send({ 
			success: false,
            titolo: "Utente non autenticato",
			dettagli: "Il token non è valido, è scaduto o non è possibile controllarne l'autenticità"
		});
	}

	jwt.verify(token, process.env.PRIVATE_KEY, function(err, decoded) {			
		if (err) {
			return res.status(403).send({
				success: false,
				titolo: "Permessi negati",
                dettagli: "Il token non fornisce i permessi richiesti"
			});		
		} else {
			req.loggedUser = decoded;
			next();
		}
	});
	
};

export default tokenChecker;