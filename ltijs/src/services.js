require("dotenv").config();

const provMainDebug = require("debug")("provider:main");
const axios = require("axios");
const lti = require("ltijs").Provider;
const jwt_decode = require("jwt-decode");

const récupérerToken = function (user) {
	provMainDebug("Récupération du token pour " + user.username);
	if (user.token && tokenEstValide(user.token)) {
		provMainDebug("Token valide trouvé");
		return user.token;
	} else {
		provMainDebug("Token non trouvé ou invalide. ");
		if (user.authKey_nom && user.authKey_secret) {
			provMainDebug("Login via clé d'authentification. ");
			return loginEtObtenirToken(user.username, user.authKey_nom, user.authKey_secret).then((token) => {
				provMainDebug("Token obtenu: " + token);
				sauvegarderToken(user, token);
				return token;
			});
		} else {
			provMainDebug("Clé d'authentification non trouvée. ");
			return null;
		}
	}
};

const récupérerUser = function (userId) {
	const db = lti.Database;
	return db.Get(null, "user", { userId: userId }).then((resultat) => {
		if (resultat.length != 1) {
			provMainDebug(`User ${userId} non trouvé.`);
			return null;
		}

		const user = resultat[0];
		provMainDebug("User trouvé. " + JSON.stringify(user));
		return user;
	});
};

const tokenEstValide = function (token, délais = 300) {
	const token_décodé = jwt_decode(token);
	return Math.floor(Date.now() / 1000) + délais < token_décodé.expired;
};

const loginEtObtenirToken = function (username, authKey_nom, authKey_secret) {
	provMainDebug("Requête : " + process.env.API_URL + "/auth");
	provMainDebug("Params: username " + username + ", authKey_nom " + authKey_nom );

	return axios
		.post(process.env.API_URL + "/auth", {
			username: username,
			key_name: authKey_nom,
			key_secret: authKey_secret,
		})
		.then((res) => res.data.Token);
};

const sauvegarderToken = function (user, token) {
	const db = lti.Database;

	return db
		.Replace(
			null,
			"user",
			{ userId: user.userId },
			{
				userId: user.userId,
				username: user.username,
				token: token,
				authKey_nom: user.authKey_nom,
				authKey_secret: user.authKey_secret,
			},
		)
		.then((result) => provMainDebug("Token sauvegardé"))
		.catch((error) => provMainDebug("Erreur de sauvegarde : " + error));
};

const sauvegarderUser = function (user) {
	const db = lti.Database;

	return db
		.Replace(
			null,
			"user",
			{ userId: user.userId },
			{
				userId: user.userId,
				username: user.username,
			},
		)
		.then((result) => provMainDebug("User sauvegardé"))
		.catch((error) => provMainDebug("Erreur de sauvegarde : " + error));
};

module.exports = {
	récupérerToken,
	récupérerUser,
	sauvegarderToken,
	sauvegarderUser,
}
