import { VCodeMirror } from "./vcodemirror";
import parseMD from "@/util/parse";

export default {
	name: "EditeurCode",
	components: {
		VCodeMirror,
	},

	data() {
		return {
			indicateurSauvegardeEnCours: false,
			indicateurModifié: false,
			sauvegardeAutomatique: null,
			thèmeSombre: localStorage.getItem("thème") === "true",
			modeCréation: localStorage.getItem("modeCréation") === "true",
		};
	},
	watch: {
		thèmeSombre() {
			localStorage.setItem( "thème", this.thèmeSombre );
		},
		modeCréation() {
			localStorage.setItem( "modeCréation", this.modeCréation );
		},
	},
	computed: {
		modeÉdition() {
			return this.$store.state.mode_édition;
		},
		code() {
			return this.$store.state.tentative.code;
		},
		thème(){
			return this.thèmeSombre?"monokai":"default";
		},
		ebauches() {
			return this.$store.state.question.ebauches ?? [];
		},
		mode() {
			return this.$store.state.tentative.langage;
		},
		tentative() {
			return this.$store.state.tentative;
		},
		classeIndicateur() {
			return this.indicateurSauvegardeEnCours ? "en-cours" : this.indicateurModifié ? "non-sauvegardé" : "sauvegardé";
		},
		envoiEnCours() {
			return this.$store.state.envoiTentativeEnCours;
		},
		retroactionTentative() {
			let tentative = this.$store.state.retroactionTentative;

			return tentative ? new Proxy(tentative, {
				get: function (obj, prop) {
					return prop == "feedback" ? parseMD(obj[prop]) : obj[prop];
				},
			}) : null;
		},
		tentative_réussie() {
			return this.$store.state.tentative.réussi;
		},
		testsRéussisPct() {
			return (this.$store.state.retroactionTentative.tests_réussis / this.$store.state.question.tests.length) * 100;
		},
	},

	created() {
		window.onbeforeunload = this.beforeWindowUnload;
	},

	beforeUnmount() {
		this.sauvegarder();
		window.removeEventListener("beforeunload", this.beforeWindowUnload);
	},

	methods: {
		onChange( texte ){
			if (this.modeCréation) {
				this.$store.dispatch("mettreAjourEbauche", texte);
			} else {
				this.$store.dispatch("mettreAjourCode", texte);
			}
			this.texteModifié();
		},

		beforeWindowUnload() {
			if (this.indicateurModifié || this.indicateurSauvegardeEnCours) return "";
		},

		sauvegarder() {
			if (this.indicateurModifié && !this.indicateurSauvegardeEnCours) {
				this.indicateurSauvegardeEnCours = true;
				this.indicateurModifié = false;
				this.$store.dispatch("mettreAjourSauvegarde");
			}
		},

		texteModifié() {
			if (!this.indicateurModifié || !this.sauvegardeAutomatique) {
				this.sauvegardeAutomatique = setTimeout(async () => {
					this.indicateurSauvegardeEnCours = true;
					this.indicateurModifié = false;
					await this.$store
					          .dispatch("mettreAjourSauvegarde")
					          .catch((erreur) => {
					              console.log("ERREUR de sauvegarde : " + erreur);
					              this.indicateurModifié = true;
					          })
					          .finally(() => {
					              this.indicateurSauvegardeEnCours = false;
					              this.sauvegardeAutomatique = null;
					          });
				}, process.env.VUE_APP_DELAI_SAUVEGARDE);

				this.indicateurModifié = true;
			}
		},
		validerTentative() {
			this.$store.dispatch("soumettreTentative", {
				langage: this.$store.state.tentative.langage,
				code: this.$store.state.tentative.code,
			});
		},
	},
};
window.addEventListener("beforeunload", function (e) {
    var confirmationMessage = 'Voulez-vous vraiment quitter? Vos changements seront perdus!';

    (e || window.event).returnValue = confirmationMessage; 
    return confirmationMessage;
});
