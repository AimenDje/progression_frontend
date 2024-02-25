import { getData } from "@/services/request_services";

export default {
	name: "Inscription",
	emits: {
		onInscrire: Object,
	},
	props:{
		focus: Boolean,
	},
	data() {
		return {
			courriel: "",
			username: "",
			password: "",
			confirmation: "",
			persister: true,
		};
	},
	computed : {
		auth_local() {
			return this.$store.getters.configServeur.AUTH.LOCAL;
		},
		authentificationPermise(){
			return !this.$store.getters.obtenirToken() && !this.$store.state.authentificationEnCours;
		},
		champs_valides() {
			return !this.username_vide() &&
				   this.username_valide() === true &&
				   (!this.auth_local ||
					!this.password_vide() &&
					this.password_valide() === true &&
					!this.courriel_vide() &&
					this.courriel_valide() === true &&
					this.confirmation_valide() === true);
		},
	},
	watch : {
		focus(){
			if(this.focus){
				const champ = this.auth_local ? this.$refs.courriel : this.$refs.identifiant;
				if(!champ.focused)
					champ.focus();
			}
		}
	},
	async mounted(){
		this.proposer_username();
		if(this.focus){
			const champ = this.auth_local ? this.$refs.courriel : this.$refs.identifiant;
			if(!champ.focused)
				champ.focus();
		}
	},
	methods: {
		courriel_vide(){
			return this.courriel.trim() == "";
		},
		password_vide() {
			return this.auth_local && this.password == "";
		},
		username_vide() {
			return this.username.trim() == "";
		},
		courriel_valide(){
			if (!this.courriel_vide() && !this.courriel.toLowerCase().match(
				/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
			))
				return this.$t("inscription.erreur.courriel.invalide");

			return true;

		},
		password_valide(){
			if(!this.password_vide() && !this.password.trim().match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/))
				return this.$t("inscription.erreur.password.invalide");

			return true;
		},
		username_valide() {
			if (!this.username_vide() && !this.username.trim().match(/^\w{2,64}$/))
				return this.$t("inscription.erreur.username.invalide");

			return true;
		},
		confirmation_valide() {
			if(this.auth_local && this.confirmation != this.password)
				return this.$t("inscription.erreur.password.confirmation");

			return true;
		},
		inscrire() {
			if (this.champs_valides) {
				this.$emit("onInscrire", { courriel: this.courriel.trim(), identifiant: this.username.trim(), password: this.password, persister: this.persister, inscrire: true });
			}
		},
		async proposer_username(){
			const user = (await getData("https://randomuser.me/api/?format=json&inc=login&noinfo", null, null, {withCredentials: false})).results[0].login.username ?? "";
			if(user != ""){
				this.username=user;
			}
		}
	}
};
