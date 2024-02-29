export default {
	name: "EditeurToolbar",
	data() { 
		return {
			pressePapier: navigator.clipboard,
			
			copié: false
		};
	},
	computed: {
		rôleÉditeur() {
			return this.$store.getters.indicateursDeFonctionnalité("tout_voir");
		},
		xray() {
			return this.$store.getters.xray && this.$store.getters.indicateursDeFonctionnalité("tout_voir");
		}
	},
	methods: {
		basculerXray(){
			this.$store.dispatch("setPréférences", {xray: !this.xray} );
		},
		copy() {
			if(this.pressePapier) {
				const code = this.$store.getters.tentative.code.split("\n").filter( (ligne) => {
					return (ligne.match(/[+-]TODO|VISIBLE/g) || []).length !=1;
				}).join("\n").replace( /[+-]TODO|VISIBLE/g, "" );

				this.pressePapier.writeText( code );
				this.copié=true;
			}
			setTimeout( () =>{
				this.copié=false;
			}, 1000 );
		}
	}
};
