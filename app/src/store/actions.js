import {
	authentifierApi,
	inscrireApi,
	callbackGrade,
	getConfigServeurApi,
	getAvancementApi,
	getTousAvancementsApi,
	getQuestionApi,
	getTentativeApi,
	getTokenApi,
	getUserApi,
	getUserAvecTentativesApi,
	postAvancementApi,
	patchUserApi,
	postCommentaireApi,
	postRésultat,
	postSauvegardeApi,
	postTentative,
	postTentativeSys,
	postAuthKey
} from "@/services/index.js";

import {i18n, sélectionnerLocale} from "@/util/i18n";
import {copie_profonde, AuthentificationError} from "@/util/commun.js";
import {lock} from "@/util/lock";
import jwt_decode from "jwt-decode";
import store from "./store.js";

var validateur = (v) => v;

const valider = async function (promesse) {
	return validateur(promesse());
};

const API_URL = import.meta.env.VITE_API_URL;

async function rafraîchirToken() {
	const authKey = récupérerCléSauvegardée();
	const username = récupérerUsername();

	if (username && authKey) {
		try {
			const lien_tokens = store.getters.user?.liens?.tokens ?? store.getters.configServeur?.liens?.tokens;
			return lien_tokens ? await getTokenApi(lien_tokens, username, authKey) : null;
		}
		catch(err) {
			console.log(err);
			throw new AuthentificationError("Erreur d'authentification.");
		}
	} else {
		const err = new AuthentificationError("Clé d'authentification non disponible.");
		console.log(err);
		throw err;
	}
}

function récupérerUsername() {
	return sessionStorage.getItem("username") ?? localStorage.getItem("username");
}

function récupérerCléSauvegardée() {
	return sessionStorage.getItem("authKey_nom") ?? localStorage.getItem("authKey_nom");
}

function générerAuthKey(user, token, expiration = 0) {
	const clé_id = "LTIauthKey_" + randomID();

	return {
		nom: clé_id,
		portée: 1,
		expiration: expiration,
	};
}

function randomID() {
	// Math.random should be unique because of its seeding algorithm.
	// Convert it to base 36 (numbers + letters), and grab the first 9 characters
	// after the decimal.
	return Math.random().toString(36).substr(2, 9);
}

function récupérerListeAvecPourcentageRéussi(élémentsRéussis) {

	const réussis = Object.keys(élémentsRéussis);
	const listeRéussis = [];
	for (let langage of réussis) {
		let pourcentage = récupérerPourcentageRéussi(élémentsRéussis, langage);
		listeRéussis.push([langage, pourcentage]);
	}

	return listeRéussis;

}

function récupérerPourcentageRéussi(réussis, langage) {
	var totalRéussi = 0;
	var pourcentage = 0;
	for (var tentative in réussis) {
		totalRéussi += réussis[tentative];
	}
	pourcentage = (100 / totalRéussi) * réussis[langage];
	return pourcentage.toFixed(1);
}

function sélectionnerTentative(avancement, question, options) {
	if(question?.sous_type == "questionProg")
		return sélectionnerTentativeProg(avancement, question, options.lang_défaut);
	
	if(question?.sous_type == "questionSys"){
		return sélectionnerTentativeSys(avancement, question);
	}
}

function sélectionnerTentativeProg(avancement, question, lang_défaut) {
	var tentative;

	if (Object.keys(avancement.sauvegardes).length > 0) {
		var datePlusRecente = 0;
		for (var key in avancement.sauvegardes) {
			if (avancement.sauvegardes[key].date_sauvegarde > datePlusRecente) {
				tentative = {
					code: avancement.sauvegardes[key].code,
					langage: key,
					resultats: []
				};
				datePlusRecente = avancement.sauvegardes[key].date_sauvegarde;
			}
		}
	} else if (avancement.tentatives.length > 0) {
		tentative = avancement.tentatives[0];
	} else if (question) {
		var ebauches = question.ebauches;
		if (ebauches[lang_défaut]) {
			tentative = ebauches[lang_défaut];
		} else {
			tentative = ebauches[Object.keys(ebauches)[0]];
		}
	}

	return tentative;
}

function sélectionnerTentativeSys(avancement) {
	if (avancement.tentatives.length > 0) {
		return avancement.tentatives[0];
	}
	else return { conteneur_id: "", url_terminal: "" };
}

export default {
	async setValidateur(v) {
		validateur = v;
	},

	async setUnleash({ commit }, unleash) {
		commit("setUnleash", unleash);
	},

	async setErreurs({ commit, state }, erreurs) {
		if(state.erreurs.length>=5) state.erreurs.splice(0,1);
		state.erreurs.push(erreurs);
		commit("setErreurs", state.erreurs);
	},

	async réinitialiserErreurs({ commit }) {
		commit("setErreurs", []);
	},

	async setErreurCallback({ commit }, erreur) {
		commit("setErreurCallback", erreur);
	},

	async getToken({ commit, getters }) {
		try{
			return await lock( "token", async () => {
				var token = getters.obtenirToken();
				if(!token){
					token = await rafraîchirToken();
					commit("setToken", token);
				}
				return token;
			});
		}
		catch (e) {
			commit("setToken", null);
			throw e;
		}
	},

	async récupérerConfigServeur({ commit, getters }, urlConfig) {
		return valider(async () => {
			const token = getters.obtenirToken();

			var config=null;
			if(token){
				config = await getConfigServeurApi(urlConfig, token);
			}
			else{
				const authKey = récupérerCléSauvegardée();
				const username = récupérerUsername();
				if( username && authKey ) {
					try{
						config = await getConfigServeurApi(urlConfig, null, username, authKey );
					}
					catch(err){
						config = await getConfigServeurApi(urlConfig);
					}
				}
				else{
					config = await getConfigServeurApi(urlConfig);
				}
			}

			commit("setConfigServeur", config);
			return config;
		});
	},

	async inscrire( {commit} ,  params ){
		const urlInscription = store.getters.configServeur.liens.inscrire;
		const courriel = params.courriel;
		const username = params.identifiant;
		const motDePasse = params.password;

		commit("setEnChargement", true);
		commit("setUsername", username);
		try {
			return await inscrireApi(urlInscription, username, courriel, motDePasse);
		}
		finally {
			commit("setEnChargement", false);
			commit("updateAuthentificationEnCours", false);
		}

	},

	async authentifier({ commit }, params) {
		const urlAuth = API_URL;
		const identifiant = params.identifiant;
		const password = params.password;
		const persister = params.persister;
		const domaine = params.domaine;
		commit("updateAuthentificationEnCours", true);

		commit("setEnChargement", true);
		try {
			const token = await authentifierApi(urlAuth, identifiant, password, domaine);
			commit("setToken", token);

			// Obtenir l'utilisateur
			const user = await this.dispatch("récupérerUser", token.liens.user);

			const storage = persister ? localStorage : sessionStorage;
			storage.setItem("username", user.username);

			// Obtenir la clé d'authentification
			var clé = générerAuthKey(user, token, persister ? 0 : (Math.floor(Date.now() / 1000 + parseInt(import.meta.env.VITE_API_AUTH_KEY_TTL))));

			const authKey = await postAuthKey({ url: user.liens.clés, clé: clé }, identifiant, password, domaine);

			storage.setItem("authKey_nom", authKey.nom);

			return token;
		}
		finally {
			commit("setEnChargement", false);
			commit("updateAuthentificationEnCours", false);
		}
	},

	async déconnexion({commit}){
		sessionStorage.removeItem("authKey_nom");
		localStorage.removeItem("authKey_nom");
		localStorage.removeItem("username");
		sessionStorage.removeItem("username");

		commit("setUsername", null);
		commit("setUser", null);
		commit("setToken", null);
		commit("setConfigServeur", null);
	},

	async récupérerTokenScore({ commit, state }) {
		if (state.tokenScore) return state.tokenScore;

		const authKey = récupérerCléSauvegardée();
		const username = récupérerUsername();
		const id = `${username}/${state.uri}`;

		const token_modèle = {
			data: {
				expiration: "0",
				fingerprint: false,
				data : {
					url_avancement: API_URL + `avancement/${id}`,
				},
				ressources : {
					avancement: {
						url: `^avancement/${id}$`,
						method: "^GET$"
					},
					tentative: {
						url: `^tentative/${id}/.*$`,
						method: "^GET$"
					},
					commentaire: {
						url: `^commentaire/${id}/.*$`,
						method: "^GET$"
					},
					commentaires: {
						url: `^tentative/${id}/.*/commentaires$`,
						method: "^POST$"
					}
				}
			}
		};

		return valider(async () => {
			const lien_tokens = store.getters.user.liens.tokens;
			const token = await getTokenApi(lien_tokens, username, authKey, token_modèle);

			commit("setTokenScore", token);
			return token;
		});
	},

	async mettreÀJourUser( {commit}, params ){
		return valider(async () => {
			const user =  await patchUserApi( { url: params.url, user: params.user } , params.token );
			commit("setUser", user);
			return user;
		});
	},

	async récupérerUser({ commit }, urlUser) {
		return valider(async () => {
			commit("setEnChargement", true);
			try {
				const token = await this.dispatch("getToken");
				const user = await getUserApi(urlUser, token);

				commit("setUsername", user.username);
				commit("setUser", user);
				if(!user.préférences.locale){
					user.préférences.locale = sélectionnerLocale(null);
				}
				commit("setPréférences", user.préférences);

				return user;
			}
			finally {
				commit("setEnChargement", false);
			}
		}
		);
	},

	async récupérerQuestion({ commit }, urlQuestion) {
		commit("setQuestion", null);
		commit("setAvancement", null);
		commit("setTentative", null);
		return valider(async () => {
			commit("setEnChargement", true);
			const token = await this.dispatch("getToken");
			try {
				const question = await getQuestionApi(urlQuestion, token);
				commit("setQuestion", question);
				return question;
			}
			catch (e) {
				if(e?.response?.status == 422){
					throw i18n.global.t("erreur.question_invalide");
				}
				else if (e?.response?.status == 502) {
					throw i18n.global.t("erreur.question_introuvable");
				}
				else {
					throw e;
				}
			}
			finally {
				commit("setEnChargement", false);
			}
		}
		);
	},

	async récupérerAvancement({ commit, state }, params) {
		return valider(
			async () => {
				commit("setEnChargement", true);
				try {
					const token = await this.dispatch("getToken");
					const tokenRessources = params.tokenRessources;
					const avancement = await getAvancementApi(params.url, token, tokenRessources);
					commit("setAvancement", avancement);
					const tentative = sélectionnerTentative(avancement, state.question, {lang_défaut: state.langageDéfaut} );

					commit("setTentative", tentative);

					return avancement;
				}
				finally {
					commit("setEnChargement", false);
				}
			}
		);
	},

	async récupérerTousAvancements({ commit }, params) {
		return valider(
			async () => {
				commit("setEnChargement", true);
				try {
					const token = await this.dispatch("getToken");
					const tokenRessources = params.tokenRessources;
					const avancements = await getTousAvancementsApi(params.url, token, tokenRessources);

					return avancements;
				}
				finally {
					commit("setEnChargement", false);
				}
			}
		);
	},

	async sauvegarderAvancement({ commit, state }, params) {
		return valider(async () => {
			commit("setEnChargement", true);
			try {
				const token = await this.dispatch("getToken");
				const avancement = await postAvancementApi(params, token);
				if(! (params.question_uri in state.user.avancements)){
					state.user.avancements[params.question_uri]=avancement;
				}

				return avancement;
			}
			finally {
				commit("setEnChargement", false);
			}
		});
	},

	async setAvancement({ commit, state }, params) {
		commit("setAvancement", params.avancement);
		commit("setTentative", sélectionnerTentative(params.avancement, state.question, {lang_défaut: state.langageDéfaut}));
	},
	
	async créerCommentaire( params ) {
		return valider(async () => {
			const token = await this.dispatch("getToken");
			return await postCommentaireApi(params, token);
		}
		);
	},

	async récupérerTentative({ commit }, params) {
		return valider(async () => {

			commit("setEnChargement", true);

			try {
				const token = await this.dispatch("getToken");
				const tokenRessources = params.tkres;
				const tentative = await getTentativeApi(params.urlTentative, token, tokenRessources);
				commit("setTentative", tentative);
				return tentative;
			}
			finally {
				commit("setEnChargement", false);
			}
		}
		);
	},

	async récupérerNbRéussitesParLangage({ commit }, params) {
		var langagesRéussis = new Object();
		var ceLangageEstRéussi = new Object();

		var token;
		var user;
		return valider(async () => {
			token = params.token ?? await this.dispatch("getToken");
			user = await getUserAvecTentativesApi(params.url, token);

			for (var id in user.avancements) {

				const avancement = user.avancements[id];
				const tentatives = avancement.tentatives;
				for (let tentative of tentatives) {
					ceLangageEstRéussi[tentative.langage] = false;
				}
				for (let tentative of tentatives) {
					if (tentative.réussi) {
						if (tentative.langage in langagesRéussis) {
							if (ceLangageEstRéussi[tentative.langage] == false) {
								langagesRéussis[tentative.langage] += 1;
								ceLangageEstRéussi[tentative.langage] = true;
							}
						}
						else {
							if (ceLangageEstRéussi[tentative.langage] == false) {
								langagesRéussis[tentative.langage] = 1;
								ceLangageEstRéussi[tentative.langage] = true;
							}
						}
					}
				}
			}
			langagesRéussis = récupérerListeAvecPourcentageRéussi(langagesRéussis);
			commit("setNbRéussitesParLangage", langagesRéussis);
			return langagesRéussis;
		}
		);
	},

	async récupérerDifficultésRéussies({ commit }, params) {
		var difficultésRéussies = new Object();

		var token;
		var user;

		return valider(async () => {
			token = params.token ?? await this.dispatch("getToken");
			user = await getUserApi(params.url, token);

			for (const idAvancement in user.avancements) {
				const avancement = user.avancements[idAvancement];
				if (avancement.niveau === null || avancement.niveau === "") {
					avancement.niveau = "[N/D]";
				}
				if (avancement.état == "réussi") {
					if (avancement.niveau in difficultésRéussies) {
						difficultésRéussies[avancement.niveau] += 1;
					}
					else {
						difficultésRéussies[avancement.niveau] = 1;
					}
				}
			}
			difficultésRéussies = récupérerListeAvecPourcentageRéussi(difficultésRéussies);
			commit("setDifficultésRéussies", difficultésRéussies);
			return difficultésRéussies;
		}
		);
	},

	async soumettreTentative({ commit, state, getters }, première = false) {
		commit("updateEnvoieTentativeEnCours", true);
		commit("setRésultats", [] );
		commit("setFeedback", null );
		commit("setErreurCallback", null);

		return valider(async () => {
			try {
				const token = await this.dispatch("getToken");
				var tentative = null;
				if(getters.question_type == "sys"){
					if(première) {
						tentative = await postTentativeSys({tentative: state.tentative, urlTentative: state.avancement.liens.tentatives}, token);
						tentative.resultats = null;
					}
					else {
						tentative = await postTentativeSys({tentative: state.tentative, urlTentative: state.avancement.liens.tentatives}, token);
					}
				}
				else{
					tentative = await postTentative({tentative: state.tentative, urlTentative: state.avancement.liens.tentatives}, token);
				}

				commit("setTentative", tentative);
				commit("updateEnvoieTentativeEnCours", false);
				state.avancement.tentatives.unshift(tentative);
				if (state.avancement.état != "réussi") {
					state.avancement.état = tentative.réussi ? "réussi" : "non_réussi";
				}

				if (state.cb_succes && state.cb_succes_params) {
					try{
						const tokenScore = await store.dispatch("récupérerTokenScore");
						await callbackGrade(state.cb_succes, {
							...state.cb_succes_params,
							uri: state.uri,
							token: tokenScore,
						});
					}
					catch(e){
						if(e.response.status == 401) {
							commit("setErreurCallback", i18n.global.t("retroaction_tentative.erreurCallback401"));
						}
						else if(e.response.status >= 400) {
							commit("setErreurCallback", i18n.global.t("retroaction_tentative.erreurCallbackAutre"));
						}
					}
				}
				return tentative;
			}
			catch (e) {
				commit("updateEnvoieTentativeEnCours", false);

				if (e?.response?.status == 400) {
					throw i18n.global.t("erreur.tentative_intraitable");
				}
				else {
					throw (e);
				}
			}
		}
		);
	},

	soumettreTestUnique({commit, state}, params) {
		const indexTestSélectionné = params.index;
		
		return valider( async () => {
			try {
				const token = await this.dispatch("getToken");
				const résultat = await postRésultat({tentative: state.tentative, test: params.test, index: params.index, url: state.question.liens.résultats}, token);

				if( !state.envoiTentativeEnCours ) {
					commit("setRésultat", {index: indexTestSélectionné, résultat: résultat});
				}
			}
			catch (e) {
				if(e?.response?.status==400) {
					throw i18n.global.t("erreur.tentative_intraitable");
				}
				else{
					throw(e);
				}
			}
		}
		);
	},

	réinitialiserConteneur({commit, state}) {
		return valider( async () => {
			try {
				commit("setConteneurEnChargement", true);
				const token = await this.dispatch("getToken");
				const tentative = await postTentativeSys({tentative: {conteneur_id: ""}, urlTentative: state.avancement.liens.tentatives}, token);

				commit("setTentative", tentative);
			}
			catch (e) {
				if(e?.response?.status==400) {
					throw i18n.global.t("erreur.tentative_intraitable");
				}
				else{
					throw(e);
				}
			}
			finally {
				commit("setConteneurEnChargement", false);
			}
		}
		);
	},

	async mettreAjourSauvegarde({ commit, state }) {
		const params = {
			url: state.avancement.liens.sauvegardes,
			code: state.tentative.code,
			langage: state.tentative.langage,
		};

		return valider(async () => {

			const token = await this.dispatch("getToken");
			const sauvegarde = await postSauvegardeApi(params, token);

			if (sauvegarde) {
				commit("setSauvegarde", sauvegarde);
				return sauvegarde;
			}
		}
		);
	},

	mettreAjourCode({ commit }, code) {
		commit("updateCodeTentative", code);
	},

	réinitialiser({ commit }, langage_p) {
		const langage = langage_p ?? this.state.tentative.langage;
		commit("setTentative", {
			langage: langage,
			code: this.state.question.ebauches[langage].code,
			resultats: [],
			tests_réussis: null
		});
	},

	réinitialiserTests({ commit, state }){
		commit("setTests", copie_profonde( state.testsInitiaux ) );
	},

	setToken({ commit }, token) {
		if (token) {
			try {
				const token_décodé = jwt_decode(token);
				if (token_décodé.username) {
					commit("setToken", token);
					commit("setUsername", token_décodé.username);
				}
			} catch (e) {
				commit("setToken", null);
				commit("setUsername", null);
				commit("setUser", null);
			}
		}
		else {
			commit("setToken", null);
		}
	},

	setUser({ commit }, user) {
		commit("setUser", user);
	},

	setUri({ commit }, uri) {
		commit("setUri", uri);
	},

	setLangageDéfaut({ commit }, langageDéfaut) {
		commit("setLangageDéfaut", langageDéfaut);
	},

	setDémo({ commit }, val) {
		commit("setDémo", val);
	},

	setCallbackSucces({ commit }, cb_succes) {
		commit("setCallbackSucces", cb_succes);
	},

	setCallbackSuccesParams({ commit }, cb_succes_params) {
		commit("setCallbackSuccesParams", cb_succes_params);
	},

	setCallbackAuth({ commit }, cb_auth) {
		commit("setCallbackAuth", cb_auth);
	},

	setCallbackAuthParams({ commit }, cb_auth_params) {
		commit("setCallbackAuthParams", cb_auth_params);
	},

	setTokenRessources({ commit }, tokenRessources) {
		commit("setTokenRessources", tokenRessources);
	},

	setUsername({ commit }, username) {
		commit("setUsername", username);
	},

	setAuthentificationErreurHandler({ commit }, authentificationErreurHandler) {
		commit("setAuthentificationErreurHandler", authentificationErreurHandler);
	},

	setThèmeSombre({ commit }, val) {
		commit("setThèmeSombre", val);
	},

	basculerThèmeSombre({ getters }) {
		this.dispatch("setPréférences", {
			apparence_thème: getters.thèmeSombre ? "clair" : "sombre",
			éditeur_thème: getters.thèmeSombre ? "default" : "monokai"
		});
	},

	basculerLocale({ commit, getters }){
		const locale = getters.locale =="fr" ? sélectionnerLocale("en") : sélectionnerLocale("fr");
		commit("setLocale", locale);
		this.dispatch("setPréférences", {
			locale: locale,
		});
	},

	setModeAffichage({ commit }, val) {
		commit("setModeAffichage", val);
	},

	basculerModeAffichage({ commit }) {
		commit("setModeAffichage", !this.state.mode_affichage );
	},

	setPréférences( {commit, state, getters}, params ) {

		const préférences = {...getters.user.préférences, ...params };
		commit("setPréférences", préférences);

		return valider( async () => {
			const token = await this.dispatch("getToken");
			await patchUserApi({url: state.user.liens.self, user: getters.user}, token);
		} );
	},

	setDisposition( _ , val ) {
		this.dispatch("setPréférences", {
			disposition: val,
		});
	},

	setIndicateursDeFonctionnalité({ commit }, val) {
		const toggles = [];
		for (const toggle of val) {
			toggles[toggle.name] = { enabled: toggle.enabled, variant: toggle.variant };
		}
		commit("setIndicateursDeFonctionnalité", toggles);
	},
	setEnvoiTestEnCours({ commit }, val) {
		commit("setEnvoiTestEnCours", val);
	},
	setEntréeTest({ commit }, val) {
		commit("setEntréeTest", val);
	},
	setParamsTest({ commit }, val) {
		commit("setParamsTest", val);
	},
	setTest({ commit }, val) {
		commit("setTest", val);
	},
	setRésultat({ commit }, val) {
		commit("setRésultat", val);
	},
	setRésultats({ commit }, val) {
		commit("setRésultats", val);
	},
	setTests({ commit }, val) {
		commit("setTests", val);
	},
};
