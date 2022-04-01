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
	},
	mounted() {
		this.$mousetrap.bind(this.$store.state.ctrlAltD, this.changer_mode_affichage);
	},
	methods:{
		changer_mode_affichage(){
			this.$store.dispatch("setModeAffichage",!this.$store.state.mode_affichage);
		}
	}
};
