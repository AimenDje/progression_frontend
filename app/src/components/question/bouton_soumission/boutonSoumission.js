export default {
	name: "BoutonSoumission",
	computed: {
		question_type(){
			return this.$store.getters.question_type;
		},
		raccourcis(){
			return this.$store.state.raccourcis;
		},
		envoiEnCours() {
			return this.$store.state.envoiTentativeEnCours;
		},
		erreurCallback() {
			return this.$store.state.erreur_callback;
		}
	},
	methods: {
		validerTentative() {
			this.$store.dispatch("soumettreTentative", false );
		}, 
	}
	
};
