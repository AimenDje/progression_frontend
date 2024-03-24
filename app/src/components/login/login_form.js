export default {
	name: "LoginLDAP",
	emits: {
		onLogin: Object,
	},
	props : {
		domaine: String,
		url_mdp_reinit: String,
		focus: Boolean
	},
	data() {
		return {
			identifiant: "",
			password: "",
			persister: true,
		};
	},
	watch : {
		focus(){
			if(this.focus){
				this.$nextTick(this.$refs.identifiant.focus);
			}
		},
		username(){
			this.identifiant = this.username ?? "";
		}
	},
	mounted(){
		if(this.focus){
			this.$nextTick(this.$refs.identifiant.focus);
		}
		this.identifiant = this.username ?? "";
	},
	computed: {
		username: function(){
			return this.$store.state.username;
		},
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
			return this.identifiant?.trim() == "";
		},
		identifiant_valide() {
			if( !this.identifiant_vide && !this.identifiant?.trim().match(
				/^\w{2,64}$|^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
			))
				return this.$t("login.identifiantInvalide");

			return true;
		},
		champs_valides() {
			return !this.identifiant_vide &
				   this.identifiant_valide &&
				   !this.password_vide;
		}

	},
	methods: {
		login() {
			if (this.champs_valides){
				this.$emit("onLogin", { identifiant: this.identifiant?.trim(), password: this.password, persister: this.persister, domaine: this.domaine });
			}
		},
	},
};
