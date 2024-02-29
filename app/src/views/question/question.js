import OngletsInformation from "@/components/question/onglets_information/onglets_information.vue";
import Enonce from "@/components/question/enonce/enonce.vue";
import EditeurCode from "@/components/question/editeur/editeur.vue";
import EditeurToolbar from "@/components/question/editeur/toolbar.vue";
import RetroactionTentative from "@/components/question/retroaction_tentative/retroaction_tentative.vue";
import Présentation from "@/components/question/présentation/présentation.vue";
import BoutonCommentaire from "@/components/question/commentaires/bouton.vue";
import PanneauCommentaire from "@/components/question/commentaires/sidebar.vue";
import Avancement from "@/components/question/avancement/avancement.vue";
import BoutonSoumission from "@/components/question/bouton_soumission/boutonSoumission.vue";
import BoutonRéinitialiserTests from "@/components/question/bouton_réinitialiser_tests/bouton_réinitialiser_tests.vue";
import TTYShare from "@/components/question/ttyshare/ttyshare.vue";
import jwt_decode from "jwt-decode";
import Diptyque from "@/components/diptyque/diptyque.vue";

const API_URL = import.meta.env.VITE_API_URL;

export default {
	name: "Question",
	data() {
		return {
			panneauCommentaireOuvert: false,
		};
	},
	components: {
		OngletsInformation,
		Enonce,
		Avancement,
		EditeurCode,
		EditeurToolbar,
		RetroactionTentative,
		Présentation,
		BoutonCommentaire,
		BoutonSoumission,
		BoutonRéinitialiserTests,
		PanneauCommentaire,
		Diptyque,
		TTYShare,
	},
	computed: {
		user() {
			return this.$store.state.user;
		},
		question() {
			return this.$store.state.question;
		},
		question_type() {
			return this.$store.getters.question_type;
		},
		avancement() {
			return this.$store.state.avancement;
		},
		tentative() {
			return this.$store.state.tentative;
		},
		resultats() {
			return this.$store.state.tentative?.resultats;
		},
		uri() {
			return this.$store.state.uri;
		},
		lang() {
			return this.$store.state.langageDéfaut;
		},
		démo() {
			return this.$store.state.démo;
		},
		thèmeSombre() {
			return this.$store.getters.thèmeSombre;
		},
		indicateursDeFonctionnalitéCommentaires() {
			return this.$store.getters.indicateursDeFonctionnalité("commentaires");
		},
		raccourcis() {
			return this.$store.state.raccourcis;
		},
		taillePanneauÉnoncé() {
			return this.$store.getters?.préférences?.disposition?.énoncé ?? 30;
		},
		tailleÉditeur() {
			return this.$store.getters?.préférences?.disposition?.éditeur ?? 60;
		}
	},
	watch: {
		uri: function () {
			if (this.uri && this.user) this.récupérerQuestion();
		},
		user: function () {
			if (this.uri && this.user) this.récupérerQuestion();
		},
		question: function () {
			if(this.$store.state.question)
				this.récupérerOuCréerAvancement();
		},
		avancement: function (){
			if (this.$store.state.question?.sous_type == "questionSys"){
				this.$store.dispatch("soumettreTentative", true);
			}
		},
		resultats: function (){
			if (this.resultats){
				for(var index in this.resultats){
					if(!this.resultats[index]?.résultat){
						this.panneauTestsAffiché=true;
						break;
					}
				}
			}
		},
	},
	mounted() {
		this.$store.dispatch("réinitialiserErreurs");
		this.$store.dispatch("setErreurCallback", null);
		this.traiterParamètresURL(window.location.search);
		if (!this.question && this.uri && this.user) this.récupérerQuestion();
	},
	provide() {
		return {
			avancement: this.avancement
		};
	},
	methods: {
		traiterParamètresURL(paramètres) {
			var urlParams = new URLSearchParams(paramètres);

			if (urlParams.has("uri")) {
				this.$store.dispatch("setUri", urlParams.get("uri"));
			}
			else{
				this.$router.push({name: "Home"});
			}

			if (urlParams.has("lang")) {
				this.$store.dispatch("setLangageDéfaut", urlParams.get("lang"));
			}

			this.$store.dispatch("setDémo", urlParams.has("demo"));

		},
		récupérerOuCréerAvancement() {
			if (this.$store.state.tokenRessources) {
				const tokenRessourcesDécodé = jwt_decode(this.$store.state.tokenRessources);
				const url_avancement = tokenRessourcesDécodé.data["url_avancement"];

				this.récupérerAvancement(url_avancement);
			}
			else{
				const username = this.user.username;
				const id_avancement = username + "/" + this.uri;
				if (id_avancement in this.user.avancements){
					this.récupérerAvancement(this.user.avancements[id_avancement].liens.self);
				}
				else{
					const avancement = { etat: "début", ...(this.$store.state.cb_succes ? {
						extra: JSON.stringify({
							cb_succes: this.$store.state.cb_succes,
							cb_succes_params: this.$store.state.cb_succes_params ?? ""
						})
					} : {}) };
					this.sauvegarderAvancement(avancement).then((avancement) => {
						this.$store.dispatch("setAvancement", {avancement: avancement});
					});
				}
			}
		},
		récupérerAvancement(url_avancement) {
			this.$store
				.dispatch("récupérerAvancement", {
					url: url_avancement,
					tokenRessources: this.$store.state.tokenRessources,
				}).then((avancement) => {
					if (!this.$store.state.cb_succes) {
						this.extraire_infos_callback(avancement);
					}
					else {
						this.mettre_à_jour_infos_callback(avancement);
					}
				});
		},
		extraire_infos_callback(avancement){
			if(avancement?.extra?.cb_succes){
				this.$store.dispatch("setCallbackSuccesParams", avancement.extra.cb_succes_params);
				this.$store.dispatch("setCallbackSucces", avancement.extra.cb_succes);
			}
		},
		mettre_à_jour_infos_callback(avancement){
			if (this.$store.state.cb_succes != avancement?.extra?.cb_succes ||
			JSON.stringify(this.$store.state.cb_succes_params) != JSON.stringify(avancement?.extra?.cb_succes_params)) {
				this.sauvegarderAvancement( this.$store.state.cb_succes ? {
					extra: JSON.stringify({
						cb_succes: this.$store.state.cb_succes,
						cb_succes_params: this.$store.state.cb_succes_params ?? ""
					})
				} : {} );
			}
		},
		sauvegarderAvancement(avancement){
			return this.$store
				.dispatch("sauvegarderAvancement", {
					url: this.user.liens.avancements,
					question_uri: this.uri,
					avancement
				});
		},
		récupérerQuestion() {
			this.$store.dispatch("récupérerQuestion", API_URL + "/question/" + this.uri);
		},
		basculerMenuCommentaire() {
			this.panneauCommentaireOuvert = !this.panneauCommentaireOuvert;
		},
		redimensionnéÉnoncé( taille ) {
			const disposition = this.$store.getters?.préférences?.disposition ?? {énoncé: 0};
			disposition.énoncé = taille;
			this.$store.dispatch( "setDisposition", disposition );
		},
		redimensionnéÉditeur( taille ) {
			const disposition = this.$store.getters?.préférences?.disposition ?? {éditeur: 0};
			disposition.éditeur = taille;
			this.$store.dispatch( "setDisposition", disposition );
		}
	},
};
