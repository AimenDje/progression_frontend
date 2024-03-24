<template>
	<div v-if="configServeur">
		<BoîteInfo
			:montrer="validationRéussie"
			:titre="$t('validationCourriel.titreSuccès')"
			:message="messageInformation"
		/>
		<BoîteConfirmation
			:montrer="erreurDeValidation"
			:titre="$t('validationCourriel.titreÉchec')"
			:message="$t('validationCourriel.échouée')"
			@onRéponse="onRéponse"
		/>
		<v-container>
			<v-row>
				<v-col
					cols="12"
					xs="6"
					sm="8"
					md="10">
					<Login
						@onLogin="onLogin"
						@onInscrire="onInscrire"
						:ongletSélectionné="ongletSélectionné"
					/>
				</v-col>
			</v-row>
		</v-container>
	</div>
</template>

<script src="./login.js" />
<style src="../../css/mainMenu.css"></style>
