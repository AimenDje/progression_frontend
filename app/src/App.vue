<template>
	<metainfo>
		<template #title="{ content }">
			{{ content ? `${content} | Progression` : `Progression` }}
		</template>
	</metainfo>
	<v-app :theme="thèmeSombre?'dark':'light'" :class="{thème_sombre: thèmeSombre}">
		<v-main>
			<v-app-bar
				border="1"
				flat>
				<v-app-bar-title>
					<div>
						<div
							@click="allerVersHome"
							style="cursor:pointer; width: fit-content"
							class="font-family-serif"
						>
							<span style="color:rgb(13,202,240); font-weight: bold">Prog</span>ression
							<span v-show="dev" title="interface expérimentale">
								🥼
							</span>
						</div>
					</div>
				</v-app-bar-title>
				<div  v-if="user">

					<v-row style="align-items: center">
						<v-col  class="p-0">
							<v-card
								width="fit-content"
								flat
								:text = "username" />
						</v-col>
						<v-col>
							<v-icon
								style="margin-right: 1rem"
								icon="mdi-logout"
								@click="déconnexion">
							</v-icon>
						</v-col>
					</v-row>

				</div>

				<div v-else>
					<v-btn
						@click="connexion"
					><v-icon icon="mdi-login" />{{ $t('menu.connexion') }}</v-btn>
				</div>

			</v-app-bar>

			<BannièreErreur style="width: 75vw" />
			<NavBar v-if="user"
				@accomplissements="allerVersAccomplissements"
				@nouvelExercice="nouvelExercice"
				@basculerThèmeSombre="basculerThèmeSombre"
				@basculerLocale="basculerLocale"
				@basculerVersion="basculerVersion"
			/>

			<div v-show="enChargement" class="loader-parent">
				<div class="loader">
				</div>
			</div>

			<DialogURL :ouvrir="dialogNouvelExercice" @ok="(url) => ouvrirNouvelExercice(url)" />

			<router-view class="contenu" />

		</v-main>
	</v-app>
</template>

<script>
import { useMeta } from "vue-meta";
import BannièreErreur from "@/components/bannière/bannière_erreur.vue";
import NavBar from "@/components/navbar/navbar.vue";
import DialogURL from "@/components/dialogurl/dialogurl.vue";
 
export default {
	 name: "App",
	 setup () {
		useMeta({
			title: "Progression",
			htmlAttrs: { lang: "fr", amp: true }
		});
	},
	components: {
		BannièreErreur,
		NavBar,
		DialogURL,
	},
	data() {
		return {
			cb_auth: null,
			cb_auth_params: null,
			dialogNouvelExercice: false,
			dev: this.$store.getters.dev,
		};
	},
	created() {
		const username = sessionStorage.getItem("username") || localStorage.getItem("username");
		if(username){
			this.$store.dispatch("setUsername", username);
		}
		this.traiterParamètresURL( window.location.search );
	},
	computed: {
		user() {
			return this.$store.state.user;
		},
		username() {
			return this.$store.state.username;
		},
		enChargement() {
			return this.$store.state.enChargement;
		},
		thèmeSombre() {
			return this.$store.getters.thèmeSombre;
		},
	},
	methods: {
		traiterParamètresURL( paramètres ){
			var urlParams = new URLSearchParams(paramètres);
			if(urlParams.has("tkres")){
				this.$store.dispatch("setTokenRessources", urlParams.get("tkres"));
			}

			if(urlParams.has("cb_succes")){
				this.$store.dispatch("setCallbackSucces", urlParams.get("cb_succes"));
				if(urlParams.has("cb_succes_params")){
					this.$store.dispatch("setCallbackSuccesParams", JSON.parse(urlParams.get("cb_succes_params")));
				}
			}

			if(urlParams.has("cb_auth")){
				this.$store.dispatch("setCallbackAuth", urlParams.get("cb_auth"));
				if(urlParams.has("cb_auth_params")){
					this.$store.dispatch("setCallbackAuthParams", JSON.parse(urlParams.get("cb_auth_params")));
				}
			}
		},
		connexion(){
			this.allerVers("LoginView");
		},
		allerVersAccomplissements(){
			this.allerVers("Accomplissements");
		},
		allerVersHome(){
			this.allerVers("Home");
		},
		nouvelExercice() {
			this.dialogNouvelExercice=!this.dialogNouvelExercice;
		},
		déconnexion(){
			this.$store.dispatch("déconnexion");
			this.$router.push( {name: "Home"} );
		},
		basculerThèmeSombre() {
			this.$store.dispatch("basculerThèmeSombre");
		},
		basculerVersion() {
			const version = this.$cookies.get("fe_version");
			this.$cookies.set("fe_version", version != "dev" ? "dev" : "prod");
			window.location.reload();
		},
		basculerLocale() {
			this.$store.dispatch("basculerLocale");
		},
		allerVers( vue, query=null ){
			this.$router.push({
				name: vue,
				query: query
			});
		},
		ouvrirNouvelExercice(url) {
			if(url) {
			    this.$store.dispatch("setUri", url);
			    this.allerVers("Question", {uri: url});
			}
		}
	}
};
</script>
<style src="./css/mainMenu.css"></style>
<style src="./css/theme-sombre.css"></style>
