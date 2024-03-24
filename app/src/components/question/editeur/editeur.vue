<template>
	<div
		v-shortkey=raccourcis.sauvegarde
		@shortkey="sauvegarder"
	>
		<v-btn @click="startTogetherJS" color="primary">{{ buttonCollab }}</v-btn>
		<div
			class="indicateur_sauvegarde"
		>
			<v-icon
				:icon="icone_sauvegarde"
				size="1rem"
			/>
		</div>
		<Codemirror
			id="editor"
			ref="editor"
			présentation_étape="1.1"
			:value="code"
			:options="cmOptions"
			@ready="onReady"
		/>
		
	</div>
</template>

<script src="./editeur.js"></script>
<style src="./editeur.css"></style>
