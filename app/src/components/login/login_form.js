export default {
	name: "LoginLDAP",
	emits: {
		onLogin: Object,
	},
	props : {
		domaine: String,
		url_mdp_reinit: String,
	},
	data() {
		return {
			identifiant: "",
			password: "",
			persister: true,
		};
	},
	computed: {
		placeholder: function(){
			return this.domaine ? "@"+this.domaine : "";
		},
		authentificationPermise(){
			return !this.$store.getters.obtenirToken() && !this.$store.state.authentificationEnCours;
		},
		password_vide() {
			return this.password == "";
		},
		identifiant_vide() {
			return this.identifiant.trim() == "";
		},
		identifiant_invalide() {
			return !this.identifiant_vide && !this.identifiant.trim().match(
				/^\w{2,64}$|^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
			);
		}
	},
	methods: {
		login() {
			if (!(this.identifiant_vide ||
				  this.identifiant_invalide ||
				  this.password_vide)){

				this.$emit("onLogin", { identifiant: this.identifiant.trim(), password: this.password, persister: this.persister, domaine: this.domaine });
			}
		},
	},
};
