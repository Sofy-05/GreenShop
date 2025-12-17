import jwt from 'jsonwebtoken';

const tokenChecker = function(req, res, next) {
	var token = req.headers['Autenticazione'];

	if (!token) {
		return res.status(401).send({ 
			success: false,
            titolo: "Utente non autenticato",
			dettagli: err.message
		});
	}

	jwt.verify(token, process.env.PRIVATE_KEY, function(err, decoded) {			
		if (err) {
			return res.status(403).send({
				success: false,
				titolo: "Impossibile autenticare il token",
                dettagli: err.message
			});		
		} else {
			req.loggedUser = decoded;
			next();
		}
	});
	
};

export default tokenChecker;