import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import actions from "./store/actions.js";
import { i18n, sélectionnerLocale } from "./util/i18n";
import { AuthentificationError } from "./util/commun";
import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import { createMetaManager, plugin as metaPlugin } from "vue-meta";
import FenêtreInfo from "@/components/layouts/fenetre_info.vue";
import { plugin as VueTippy } from "vue-tippy";
import "tippy.js/dist/tippy.css"; // optional for styling
import { roundArrow } from "tippy.js"; // eslint-disable-line no-unused-vars
import Vue3Tour from "vue3-tour";
import "vue3-tour/dist/vue3-tour.css";
import VueChartkick from "vue-chartkick";
import "chartkick/chart.js";
import PerfectScrollbar from "vue3-perfect-scrollbar";
import "vue3-perfect-scrollbar/dist/vue3-perfect-scrollbar.css";
import { UnleashClient } from "unleash-proxy-client";
import shortkey from "vue3-shortkey";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import "splitpanes/dist/splitpanes.css";
import VueCookies from "vue-cookies";
import "@mdi/font/css/materialdesignicons.css";

const app = createApp(App)
	.use(router)
	.use(VueCookies)
	.use(store)
	.use(VueTippy, {
		component: "Tippy",
		defaultProps: { placement: "bottom" },
	})
	.use(createMetaManager())
	.use(metaPlugin)
	.use(Vue3Tour)
	.use(router)
	.use(VueChartkick)
	.use(PerfectScrollbar)
	.use(shortkey);

app.component("FenêtreInfo", FenêtreInfo);

const vuetify = createVuetify({ components: components });
app.use(vuetify);

VueChartkick.options = {
	colors: ["#00aeed", "#00ffee", "#8f70ff", "#ff6e90", "#8378ff", "#303eff", "#78ffdb", "#95ff5c", "#0044d6", "#58e3b7", "#ffa6f3", "#ffff40", "#ff9914", "#ff0051",
		"#00ed6b", "#0033ff", "#ff4545", "#cf6cbe", "#75bcff", "#00c476", "#ff6969", "#ffc400", "#ff4800", "#e100ff", "#45bf63", "#6324e0", "#2045d9", "#77ff38", "#a136ff"],
	empty: "--",
	loading: "...",
	round: 2,
	donut: true,
	dataset: { borderWidth: 2, hoverOffset: 2, spacing: 4, borderColor: "#ababab" }
};

// Ajout d'un listener sur la locale
store.subscribe((mutation) => {
	if (mutation.type == "setLocale" || mutation.type == "setPréférences") {
		// Propage la nouvelle locale à la composante i18n
		i18n.global.locale = sélectionnerLocale(store.getters.locale);
	}
});
app.use(i18n);

const authentificationErreurHandler = function () {
	store.dispatch("déconnexion").then(() => {
		if (router.currentRoute.value.name != "LoginView") {
			router.push({
				name: "LoginView",
				query: window.location.search,
				params: { origine: window.location.href }
			});
		}
	});
};

const valider = async (promesse) => {
	return promesse
		.catch((erreur) => {
			if (erreur?.response?.status >= 500) {
				store.dispatch("setErreurs", { détails: JSON.stringify(erreur.response.data.erreur) + " (erreur " + erreur.response.status + ") " });
			}
			else if (erreur instanceof AuthentificationError || erreur?.response?.status == 401) {
				store.dispatch("setErreurs", { message: i18n.global.t("erreur.réseau") });
				authentificationErreurHandler(erreur);
			}
			else if (typeof (erreur) == "string") {
				store.dispatch("setErreurs", { message: erreur });
			}
			else {
				store.dispatch("setErreurs", { détails: erreur });
			}
			throw erreur;
		});
};
actions.setValidateur(valider);
const unleash = new UnleashClient({
	url: import.meta.env.VITE_FF_URL,
	clientKey: import.meta.env.VITE_FF_SECRET,
	appName: import.meta.env.MODE,
});
store.dispatch("setUnleash", unleash);

unleash.on("ready", () => {
	store.dispatch("setIndicateursDeFonctionnalité", unleash.getAllToggles());
});

unleash.on("update", () => {
	store.dispatch("setIndicateursDeFonctionnalité", unleash.getAllToggles());
});

unleash.start();

router.isReady().then(() => app.mount("#app"));
