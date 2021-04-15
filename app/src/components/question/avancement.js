export default {
	name: "Avancement",
	computed: {
		avancement() {
			return this.$store.state.avancement;
		},
		tentatives() {
			return this.$store.state.avancement.tentatives;
		},
		nombreTentatives() {
			return (this.$store.state.avancement.tentatives) ? this.$store.state.avancement.tentatives.length : 0;
		},
	},
	watch: {
		nombreTentatives: function () {
			if (this.nombreTentatives > 0) {
				this.rafraichirSelectionTentative()
			}
		},
	},
	methods: {
		rafraichirSelectionTentative: function () {
			setTimeout(() => {
				var select = document.getElementById("avancement")
				select.children[1].selected = true
			}, 1000);
		},
		chargerTentative: function (lien) {
			this.$store.dispatch("getTentative", lien);
		},
		convetirDateDepuisTimeStamp: function (timestamp) {
			let date = new Date(timestamp * 1000);
			return date.toLocaleString("fr-CA");
		},
		convetirEtatEnString: function (etat) {
			let etatString;
			switch (etat) {
				case 0:
					etatString = "Vous en êtes à votre première tentative !";
					break;
				case 1:
					etatString = "La question n'a pas encore été résolue !";
					break;
				case 2:
					etatString = "La question a déjà été correctement résolue !";
					break;
				default:
					etatString = "La question est indéterminée !";
			}
			return etatString;
		}
	}
};
