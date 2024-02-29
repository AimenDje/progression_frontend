export default {
	user: state => state.user,
	username: state => state.username,
	configServeur: state => state.configServeur,
	version: state => state.configServeur.version,
	locale: state => state.user?.préférences?.locale,
	thèmeSombre: state => state.user?.préférences?.apparence_thème == "sombre",
	erreurs: state => state.erreurs,
	raccourcis: state => state.raccourcis,
	tentative: state => state.tentative,
	//On obtient le token via une fonction pour éviter qu'il soit mis en cache
	token: () => {throw Error("Utilisez getters.obtenirToken() pour obtenir un token");},
	obtenirToken: state => () => {
		if(state.token == null) return null;

		const token = state.token;
		const temps_courant = Math.round(Date.now() / 1000);
		// Retourne le token jusqu'à 10s avant son expiration
		return token?.timestamp && temps_courant < token.timestamp - 10 ? token.token : null;
	},
	indicateursDeFonctionnalité: state => (indicateur) => {
		return state.indicateursDeFonctionnalité[indicateur]?true:false;
	},
	démos: state => state.user?.préférences["démos"]!==false,
	conteneurEnChargement: state => state.conteneurEnChargement,
	question_type: state => state.question.sous_type == "questionProg" ? "prog" : "sys",
	résultats: state => state.tentative?.resultats?.map( (x) => x?.résultat ) ?? [],
	dev: state => state.dev,
	xray: state => state.user?.préférences["xray"]!==false,
};
