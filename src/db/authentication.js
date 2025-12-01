import express from 'express';
import User from '.models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router(); //gli arrivano le richieste get post...

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID | "aaa";

const client = new OAuth2Client( GOOGLE_CLIENT_ID );

async function verify( token ) {
	const ticket = await client.verifyIdToken({
		idToken: token,
		// audience: GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
	});
	const payload = ticket.getPayload(); //oggetto di risposta
	return payload;
}

router.post('/auth/login', async function (req, res) { //path (quindi titolo API),  request e response

    var user = {};

    user = await User.findOne(
        { username: req.body.username }
    ).exec(); //per eseguire la funzione

	if(!user) {
		res.status(401).json({ success: false, message: "Authentication failed. User not found."});
		return;
	}

	if(user.password != req.body.password){
		res.status(401).json({ success: false, message: "Authentication failed. Wrong password."});
		return;
	}

	var payload = {
		username: user.username,
		id: user._id,
		ruolo: user.ruolo
	}

	var option = {
		expiresIn: 86400 //il token varrà 24 ore
	}

	var token = jwt.sign(payload, process.env.PRIVATE_KEY, option);

	res.json({
		success: true,
		message: "success",
		token: token,
		username: user.username,
		id: user._id,
		ruolo: user.ruolo,
		self: "/ShopGreenAPI/1.0.0" + user._id
	})
}) 
