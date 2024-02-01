<template>
	<div>
		<v-card>
			<h1>
				<v-icon icon="mdi-trophy"/>
				{{ $t("accomplissements.titrePage") }} {{ username }}
			</h1>
		</v-card>
		<v-banner v-if="!avancements || démos"
			icon="mdi-cog"
			color="warning"
		>
			<v-banner-text>
				<v-card>
					<v-card-title>
						{{$t("accomplissements.exercices_démo")}}
					</v-card-title>
					<ul >
						<li>
							<v-btn @click='ouvrirQuestion("aHR0cHM6Ly9wcm9ncmVzc2lvbi5wYWdlcy5kdGkuY3Jvc2Vtb250LnF1ZWJlYy9jb250ZW51L2RlbW8vNjM0NGY1MzgtMGVjMy00ZTNmLTgzMDgtZmMxMGQzNWM2YWFmL2luZm8ueW1s", "demo")'>
								Exercice 1 - Bonjour le monde!</v-btn>
						</li>
						<li>
							<v-btn @click='ouvrirQuestion("aHR0cHM6Ly9wcm9ncmVzc2lvbi5wYWdlcy5kdGkuY3Jvc2Vtb250LnF1ZWJlYy9jb250ZW51L2RlbW8vNmUzNjNjYjMtNWEyOS00YjYyLThlY2YtNmJjZTI5MjNiOWQ0L2luZm8ueW1s")'>
								Exercice 2 - Bonjour Java!</v-btn>
						</li>
						<li>
							<v-btn @click='ouvrirQuestion("aHR0cHM6Ly9wcm9ncmVzc2lvbi5wYWdlcy5kdGkuY3Jvc2Vtb250LnF1ZWJlYy9jb250ZW51L2RlbW8vZGExNDNjMTEtZjc2My00MDY0LWJjMDMtNTYxZGNkODFjNmUyL2luZm8ueW1s")'>
								Exercice 3 - Un premier algorithme</v-btn>
						</li>
						<li>
							<v-btn @click='ouvrirQuestion("aHR0cHM6Ly9wcm9ncmVzc2lvbi5wYWdlcy5kdGkuY3Jvc2Vtb250LnF1ZWJlYy9jb250ZW51L2RlbW8vMzdhOTEwNGQtODJhZC00ZDZiLTk0OTktMmY2YTMxYzA1OTgyL2luZm8ueW1s")'>
								Exercice 4 - Défi complet</v-btn>
						</li>
					</ul>

				</v-card>
				<div v-if="avancements">
					<br/>
					<v-btn @click="fermerDémos"
						flat
					>
						{{$t("accomplissements.exercices_démo_non")}}
					</v-btn>
				</div>
			</v-banner-text>
		</v-banner>

		<div v-if="avancements" >
			<v-row>
				<v-col cols="8">
					<tableauExercices class="accomplissementItem" />
				</v-col>
				<v-col cols="4">
					<graphiqueStatistiques class="accomplissementItem" />
					<graphiqueStatistiquesParDifficulté  class="accomplissementItem" />
				</v-col>
			</v-row>
		</div>
		<div v-else>
			<v-card>
				{{$t("accomplissements.aucun_accomplissement")}}
			</v-card>
		</div>
	</div>
</template>

<script src="./accomplissements.js"></script>
<style src="./accomplissements.css"></style>
