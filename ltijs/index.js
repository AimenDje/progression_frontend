require("dotenv").config();

const fs = require("fs");
const path = require("path");
const provMainDebug = require("debug")("provider:main");
const lti = require("ltijs").Provider;
const mongoose = require("mongoose");
const routes = require("./src/routes");
const Mustache = require("mustache");
const jwt_decode = require("jwt-decode");
const services = require("./src/services.js");

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
	userId: String, // Id de la plateforme
	username: String, // username Progression
	token: String, // token JWT Progression
	authKey_nom: String, // Clé d'authentification Progression
	authKey_secret: String,
});
userSchema.index({ userId: 1 }, { unique: true });

try {
	mongoose.model("user", userSchema);
} catch (err) {
	provDatabaseDebug("Model already registered. Continuing");
}

lti.setup(
	process.env.LTI_KEY,
	{
		url: "mongodb://" + process.env.DB_HOST + "/" + process.env.DB_NAME + "?authSource=admin",
		connection: { user: process.env.DB_USER, pass: process.env.DB_PASS },
	},
	{
		appRoute: "/lti/",
		loginRoute: "/lti/login", // Optionally, specify some of the reserved routes
		keysetRoute: "/lti/keys", // Specifying keyset route
		staticPath: path.join(__dirname, "./public"), // Path to static files
		cookies: {
			secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
			sameSite: "", // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
		},
		devMode: true, // Set DevMode to true if the testing platform is in a different domain and https is not being used
	},
);

// When receiving successful LTI launch redirects to app
lti.onConnect(async (idToken, req, res) => {
	provMainDebug("onConnect");

	const platformUrl = jwt_decode(res.locals.ltik).platformUrl;

	const userId = idToken.platformId + "/" + idToken.user;
	provMainDebug(`userId : ${userId}`);
	const uri = btoa_url(res.locals.context.custom.uri || res.locals.context.custom.src);
	provMainDebug(`uri : ${uri}`);
	const lang = res.locals.context.custom.lang;
	provMainDebug(`lang : ${lang}`);
	const token = await services.récupérerUser( userId )
								.then( (user) => user ? services.récupérerToken(user) : null)

	const query = Object.assign(
		{
			ltik: res.locals.ltik,
			uri: uri,
			lang: lang,
			cb_succes: process.env.URL_BASE + "/lti/grade",
			cb_succes_params: JSON.stringify({
				ltik: res.locals.ltik,
			})
		},
	);

	if(res.locals.context.roles == 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'){
		const resLocalsToken = res.locals.token;
		const membres = await services.récupérerMembres( resLocalsToken );
		const scores = await services.récupérerScores( resLocalsToken );

		for(const [id,membre] of Object.entries(membres)){
			membre["score"] = scores[membre.user_id];
		};

		res.render("suivi", { membres: Object.values( membres ), query: {uri, lang} });
		res.status(200);
	}
	else{
		provMainDebug("Redirection vers : " + process.env.URL_BASE + "/question");
		lti.redirect(res, process.env.URL_BASE + "/question", {
			newResource: true,
			query: query
		});
	}
});

	
const btoa_url = (s) =>
	btoa(unescape(encodeURIComponent(s)))
		.replace(/\//g, "_")
		.replace(/\+/g, "-")
		.replace(/=/g, "");

lti.app.use(routes);

const setup = async () => {
	const app = lti.app;
	app.engine('html', consolidate.mustache);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/templates');

	await lti.deploy({ port: process.env.PORT });

	await lti.registerPlatform({
		url: "http://uri_a_changer_vers_instance_moodle:numéro_de_port",
		name: "nom_instance_moodle_a_changer",
		clientId: "identifiant_du_client_moodle_à_changer",
		authenticationEndpoint: "http://uri_a_changer_vers_instance_moodle:numéro_de_port/mod/lti/auth.php",
		accesstokenEndpoint: "http://uri_a_changer_vers_instance_moodle:numéro_de_port/mod/lti/token.php",
		authConfig: { method: "JWK_SET", key: "http://uri_a_changer_vers_instance_moodle:numéro_de_port/mod/lti/certs.php" },
	});
};

setup();
