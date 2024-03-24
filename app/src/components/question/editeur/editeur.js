import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/mode/clike/clike";
import "codemirror/mode/shell/shell";
import "codemirror/mode/python/python";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/rust/rust";
import "codemirror/mode/sql/sql";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";
import Codemirror from "codemirror-editor-vue3";
import parseMD from "@/util/parse";
import { zones } from "./zones.js";

export default {
	name: "EditeurCode",
	components: {
		Codemirror,
	},
	data() {
		return {
			indicateurSauvegardeEnCours: false,
			indicateurModifié: false,
			sauvegardeAutomatique: null,
			zonesTraitées: false,
			cm: null,
		};
	},
	watch: {
		xray() {
			if (!this.xray) {
				this.traiterZones();
			}
			else {
				this.cm.setValue(this.cm.getValue());
			}
		},
		tentative() {
			this.zonesTraitées = false;
		}
	},
	computed: {
		xray() {
			return this.$store.getters.xray && this.$store.getters.indicateursDeFonctionnalité("tout_voir");
		},
		raccourcis() {
			return this.$store.getters.raccourcis;
		},
		cmOptions() {
			return {
				mode: this.mode,
				theme: this.thème,
				lineNumbers: true,
				indentUnit: 4,
				extraKeys: { Tab: "indentAuto" },
				foldGutter: true,
				gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
				smartIndent: false,
				font: "monospace",
			};
		},
		code() {
			return this.$store.state.tentative.code;
		},
		thème() {
			return this.$store.getters.thèmeSombre ? "monokai" : "default";
		},
		ebauches() {
			return this.$store.state.question.ebauches ?? [];
		},
		mode() {
			const value = this.$store.state.tentative.langage.toLowerCase();

			if (value === "java") {
				return "mode", "text/x-java";
			} else if (value === "javascript") {
				return "mode", "javascript";
			} else if (value === "kotlin") {
				return "mode", "text/x-kotlin";
			} else if (value === "typescript") {
				return "mode", "text/typescript";
			} else if (value === "python") {
				return "mode", "python";
			} else if (value === "bash") {
				return "mode", "shell";
			} else if (value === "rust") {
				return "mode", "text/rust";
			} else if (value === "c") {
				return "mode", "text/x-csrc";
			} else if (value === "c#") {
				return "mode", "text/x-csharp";
			} else if (value === "sql") {
				return "mode", "text/x-sql";
			} else if (["cpp", "c++"].includes(value)) {
				return "mode", "text/x-c++src";
			} else {
				return "mode", value;
			}
		},
		icone_sauvegarde() {
			return this.indicateurSauvegardeEnCours ? "mdi-pencil-outline" : this.indicateurModifié ? "mdi-pencil" : "";
		},
		tentative() {
			let tentative = this.$store.state.tentative;

			return tentative ? new Proxy(tentative, {
				get: function (obj, prop) {
					return prop == "feedback" ? parseMD(obj[prop]) : obj[prop];
				},
			}) : null;
		},
		tentative_réussie() {
			return this.$store.state.tentative.réussi;
		},
		testsRéussisPct() {
			return (this.$store.state.tentative.tests_réussis / this.$store.state.question.tests.length) * 100;
		},
		sauvegardeActivée() {
			return !this.$store.state.tokenRessources || this.$store.getters.username == this.$store.state.tokenRessources.username;
		}
	},
	created() {
		window.onbeforeunload = this.beforeWindowUnload;
	},

	mounted() {
		window.TogetherJSConfig_hubBase = "https://togetherjs-hub.glitch.me";
		let script = document.createElement('script');
		script.src = "https://togetherjs.com/togetherjs-min.js";
		script.onload = () => {
			console.log("TogetherJS est chargé et configuré pour utiliser le serveur personnalisé.");
		};
		document.head.appendChild(script);
	},

	beforeUnmount() {
		this.sauvegarder();
		window.removeEventListener("beforeunload", this.beforeWindowUnload);
	},
	methods: {
		onReady(cm) {
			cm.on("beforeChange", this.onBeforeChange);
			cm.on("change", this.onChange);
			cm.on("beforeSelectionChange", this.onBeforeSelectionChange);
			this.cm = cm;
			if (!this.xray) {
				this.traiterZones();
			}
		},
		onChange(cm, changeObj) {
			this.$store.dispatch("mettreAjourCode", cm.doc.getValue());
			if (this.sauvegardeActivée) {
				this.texteModifié();
			}

			if (!this.zonesTraitées && !this.xray) {
				this.traiterZones();
				this.zonesTraitées = true;
			}

			const marks = cm.doc.findMarksAt(changeObj.from);
			if (marks.length === 0) return;
			const mark = marks[0];
			if (mark.lines.length === 0) return;

			// Enlève la ou les premières espaces
			const ligne = mark.lines[0];
			if (ligne.text.indexOf("+TODO ") > 0 &&
				ligne.text.indexOf("-TODO") > 0) {
				const range = mark.find();
				const matches = ligne.text.match(/(?<=\+TODO)(.+?)(?=-TODO)/);
				if (!matches) return;
				const remplacement = matches[1];
				if (remplacement.trim() != "" && remplacement.trim() !== remplacement) {
					cm.doc.replaceRange(remplacement.trim(), range.from, range.to);
				}
			}
		},

		onBeforeChange(cm, changeObj) {
			var markers = cm.doc.findMarksAt(changeObj.from);
			if (markers.length === 0) return;

			const mark = markers[0].find();

			// Si on a inséré un \n dans un todo en ligne
			if (mark.from.line == mark.to.line && changeObj.origin == "+input" && changeObj.text.join("") == "") {
				changeObj.cancel();
				return;
			}

			// Si la zone marquée a été effacée
			if (mark.from.line == changeObj.from.line
				&& mark.to.line == changeObj.to.line
				&& mark.from.ch == changeObj.from.ch
				&& mark.to.ch == changeObj.to.ch
				&& changeObj.text == "") {
				changeObj.update(mark.from, mark.to, " ");
			}
		},

		onBeforeSelectionChange(cm, changeObj) {
			if (changeObj.ranges.length == 0) return;
			const ranges = changeObj.ranges.filter(r => r.anchor != r.head);
			var n_ranges = [];
			ranges.forEach(range => {
				const markers = cm.doc.findMarks(range.anchor, range.head);
				n_ranges.push(...this.rogner(range, markers));
			});

			if (n_ranges.length > 0)
				changeObj.update(n_ranges);
			else {
				changeObj.update([changeObj.ranges[0]]);
			}
		},

		rogner(range, markers) {
			var ranges = [];
			var début = range.anchor;
			var marques = [];
			var pile = [];

			markers.forEach(m => {
				if (m.readonly || m.collapsed) {
					const marker = m.find();
					marques.push({ ...marker.from, type: "début" });
					marques.push({ ...marker.to, type: "fin" });
				}
			});
			marques.sort((a, b) => a.line - b.line || a.ch - b.ch || a.type > b.type);
			marques.forEach(marker => {
				if (marker.type == "début") {
					if (pile.length == 0 && début != null) {
						ranges.push({ anchor: début, head: marker });
						début = null;
					}
					pile.push(marker);
				}
				else {
					pile.pop();
					if (pile.length == 0)
						début = marker;
				}
			});

			if (début != null)
				ranges.push({ anchor: début, head: range.head });

			return ranges;
		},

		beforeWindowUnload() {
			if (this.indicateurModifié || this.indicateurSauvegardeEnCours) return "";
		},

		traiterZones() {
			zones.cacherHorsVisible(this.cm.doc);
			zones.désactiverHorsTodo(this.cm.doc, this.$store.getters.thèmeSombre ? "#272822" : "white");
		},

		async sauvegarder() {
			if (this.indicateurModifié && !this.indicateurSauvegardeEnCours) {
				this.indicateurSauvegardeEnCours = true;
				try {
					await this.$store.dispatch("mettreAjourSauvegarde");
					this.indicateurModifié = false;
				}
				catch (erreur) {
					console.log("ERREUR de sauvegarde : " + erreur);
				}
				finally {
					this.indicateurSauvegardeEnCours = false;
					clearTimeout(this.sauvegardeAutomatique);
					this.sauvegardeAutomatique = null;
				}
			}
		},

		texteModifié() {
			if (!this.indicateurModifié || !this.sauvegardeAutomatique) {
				this.sauvegardeAutomatique = setTimeout(
					this.sauvegarder
					, import.meta.env.VITE_DELAI_SAUVEGARDE);

				this.indicateurModifié = true;
			}
		},
		startTogetherJS() {
			if (window.TogetherJS) {
				window.TogetherJS(this);
			} else {
				console.error("TogetherJS n'est pas encore chargé.");
			}
		}
	},
};