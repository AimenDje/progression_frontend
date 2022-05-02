export default {
	name: "SélecteurModeAffichage",
	computed: {
		mode_affichage: {
			get: function () {
				return this.$store.state.mode_affichage;
			},
			set: function (mode) {
				this.$store.state.mode_affichage = mode;
			},
		},
		changerModeAffichageAvecRaccourci() {
			return this.$store.state.changerModeAffichageAvecRaccourci;
		}
	},
	watch: {
		changerModeAffichageAvecRaccourci() {
			if(this.changerModeAffichageAvecRaccourci === true){
				this.changer_mode_affichage();
				this.$store.dispatch("setChangerModeAffichageAvecRaccourci",false);
			}
			
		}
	},
	
	methods:{
		changer_mode_affichage(){
			this.$store.dispatch("setModeAffichage",!this.$store.state.mode_affichage);
		}
	}
};