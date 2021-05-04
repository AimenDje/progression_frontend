var VCodeMirrorComp;
import { __decorate, __metadata } from "tslib";
import CodeMirror from "codemirror";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/mode/clike/clike/";
import "codemirror/mode/python/python";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";
import { capitalize, h, markRaw } from "vue";
import ResizeObserver from "resize-observer-polyfill";
import { $theme } from "theme-helper";
import { Component, Inreactive, Prop, VueComponentBase, Watch } from "vue3-component-base";
const Events = ["focus", "blur", "scroll"];

let VCodeMirror = (VCodeMirrorComp = class VCodeMirror extends VueComponentBase {
	render() {
		return h("div", { class: "v-code-mirror" });
	}
	mounted() {
		const editor = (this.editor = markRaw(
			CodeMirror(this.$el, {
				value: this.value,
				mode: this.mode,
				theme: this.theme,
				readOnly: this.readonly,
				lineWrapping: this.wrap,
				lineNumbers: true,
				foldGutter: true,
				gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
				...this.options,
			}),
		));
		this.cacherHorsVisible(editor.doc);
		this.désactiverHorsTodo(editor.doc);
		editor.on("changes", () => {
			const value = editor.doc.getValue();
			this.backupValue = value;
			this.$emit("update:value", editor.doc.getValue());
			this.cacherHorsVisible(editor.doc);
			this.désactiverHorsTodo(editor.doc);
		});
		Events.forEach(x => {
			const eventName = "on" + capitalize(x);
			if (typeof this.$.vnode.props[eventName] === "function") {
				editor.on(x, this.$emit.bind(this, x));
			}
		});
		this.cleanEvent = markRaw(
			$theme.onchange(({ detail }) => {
				this.editor.setOption("theme", detail === "white" ? "default" : "dracula");
			}),
		);
		this.backupValue = this.value;
		this.$el._component = this;
		if (!VCodeMirrorComp.ro) {
			VCodeMirrorComp.ro = new ResizeObserver(function(entries) {
				entries.forEach(entry => {
					const that = entry.target._component;
					if (that.autoHeight) {
						that.editor.refresh();
					} else {
						that.editor.setSize(entry.contentRect.width, entry.contentRect.height);
					}
				});
			});
		}
		VCodeMirrorComp.ro.observe(this.$el);
	}
	beforeUnmount() {
		var _a, _b;
		(_a = this.cleanEvent) === null || _a === void 0 ? void 0 : _a.call(this);
		(_b = VCodeMirrorComp.ro) === null || _b === void 0 ? void 0 : _b.unobserve(this.$el);
	}
	updateValue(value) {
		if (value === this.backupValue) return;
		this.editor.setValue(value);
	}
	updateMode(value) {
		if (value === "java") {
			this.editor.setOption("mode", "text/x-java");
		} else if(value === "python") {
			this.editor.setOption("mode", value);
		} else if(["c", "cpp", "c++"].includes(value)) {
			this.editor.setOption("mode", value);
		} else {
			this.editor.setOption("mode", null);
		}
	}

	updateReadonly(value) {
		this.editor.setOption("readOnly", value);
	}
	updateWrap(value) {
		this.editor.setOption("lineWrapping", value);
	}
	focus() {
		this.editor.focus();
	}

	désactiverHorsTodo(doc) {
		let posDébut = doc.getValue().indexOf("+TODO") > -1 ? 0 : doc.getValue().indexOf("-TODO", posFin);;
		let posFin = 0;

		for (let i = 0; i < this.editor.doc.lineCount(); i++) {
			if (doc.getLine(i).match("[+-]TODO")){
				//Cache la ligne +TODO
				doc.markText(
					{ line: i-1, sticky:"after" },
					{ line: i, sticky:"after" },
					{ collapsed: true, selectRight:false },
				);
			}
		}
		
		while (posDébut > -1) {
			posFin = doc.getValue().indexOf("+TODO", posDébut);
			if (posFin == -1) {
				posFin = doc.getValue().length;
			}

			let ligneDébut = doc.posFromIndex(posDébut);
			let ligneFin = doc.posFromIndex(posFin);

			//Rend immuable
			doc.markText(
				{ line: ligneDébut.line, ch: 0 },
				{ line: ligneFin.line + 1, ch: 0 },
				{ readOnly: true, inclusiveLeft: false, inclusiveRight: true },
			);

			for (let i = ligneDébut.line; i < ligneFin.line + 1; i++)
				doc.removeLineClass(i, "background", "ligne-editable");

			posDébut = doc.getValue().indexOf("-TODO", posFin);
		}
	}

	cacherHorsVisible(doc) {
		for (let i = 0; i < this.editor.doc.lineCount(); i++) {
			doc.addLineClass(i, "background", "ligne-editable");

			if (doc.getLine(i).match("[+-]VISIBLE")){
				//Cache la ligne +VISIBLE
				doc.markText(
					{ line: i-1, sticky:"after" }, 
					{ line: i, sticky:"after" },
					{ collapsed: true, selectRight:false},
				);
			}
		}

		let posFin = 0;
		let posDébut = doc.getValue().indexOf("+VISIBLE") > -1 ? 0 : doc.getValue().indexOf("-VISIBLE", posFin);
		
		while (posDébut > -1) {
			posFin = doc.getValue().indexOf("+VISIBLE", posDébut);
			if (posFin == -1) {
				posFin = doc.getValue().length;
			}

			let ligneDébut = doc.posFromIndex(posDébut);
			let ligneFin = doc.posFromIndex(posFin);

			//Cache toute la section non visible
			doc.markText(
				{ line: ligneDébut.line -1 },
				{ line: ligneFin.line },
				{
					collapsed: "true",
				},
			);

			posDébut = doc.getValue().indexOf("-VISIBLE", posFin);
		}
	}
});
__decorate([Prop({ required: true }), __metadata("design:type", String)], VCodeMirror.prototype, "value", void 0);
__decorate([Prop({ default: null }), __metadata("design:type", String)], VCodeMirror.prototype, "mode", void 0);
__decorate([Prop(), __metadata("design:type", String)], VCodeMirror.prototype, "theme", void 0);
__decorate([Prop(), __metadata("design:type", Boolean)], VCodeMirror.prototype, "readonly", void 0);
__decorate([Prop({ default: true }), __metadata("design:type", Boolean)], VCodeMirror.prototype, "wrap", void 0);
__decorate([Prop(), __metadata("design:type", Object)], VCodeMirror.prototype, "options", void 0);
__decorate([Prop(), __metadata("design:type", Boolean)], VCodeMirror.prototype, "autoHeight", void 0);
__decorate([Inreactive, __metadata("design:type", Object)], VCodeMirror.prototype, "editor", void 0);
__decorate([Inreactive, __metadata("design:type", String)], VCodeMirror.prototype, "backupValue", void 0);
__decorate([Inreactive, __metadata("design:type", Function)], VCodeMirror.prototype, "cleanEvent", void 0);

__decorate(
	[
		Watch("value"),
		__metadata("design:type", Function),
		__metadata("design:paramtypes", [String]),
		__metadata("design:returntype", void 0),
	],
	VCodeMirror.prototype,
	"updateValue",
	null,
);
__decorate(
	[
		Watch("mode"),
		__metadata("design:type", Function),
		__metadata("design:paramtypes", [String]),
		__metadata("design:returntype", void 0),
	],
	VCodeMirror.prototype,
	"updateMode",
	null,
);
__decorate(
	[
		Watch("readonly"),
		__metadata("design:type", Function),
		__metadata("design:paramtypes", [Boolean]),
		__metadata("design:returntype", void 0),
	],
	VCodeMirror.prototype,
	"updateReadonly",
	null,
);
__decorate(
	[
		Watch("wrap"),
		__metadata("design:type", Function),
		__metadata("design:paramtypes", [Boolean]),
		__metadata("design:returntype", void 0),
	],
	VCodeMirror.prototype,
	"updateWrap",
	null,
);
VCodeMirror = VCodeMirrorComp = __decorate(
	[
		Component({
			name: "VCodeMirror",
			emits: ["update:value", ...Events],
		}),
	],
	VCodeMirror,
);
export { VCodeMirror };
