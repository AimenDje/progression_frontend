<template>
	<fieldset :disabled="!authentificationPermise">
		<v-text-field
			v-if="auth_local"
			:label="$t('inscription.courriel')"
			v-model="courriel"
			name="courriel"
			variant="underlined"
			ref="courriel"
			:rules="[courriel_valide]"
		/>

		<v-text-field
			:label="$t('inscription.username')"
			v-model="username"
			name="username"
			:rules="[username_valide]"
			ref="identifiant"
			variant="underlined"
		>
			<template v-slot:append-inner>
				<v-icon
					icon="mdi-sync"
					@click="proposer_username"
				>
				</v-icon>
			</template>
		</v-text-field>

		<v-text-field
			v-if="auth_local"
			:label="$t('login.motDePasse')"
			v-model="password"
			name="passwd"
			type="password"
			variant="underlined"
			:rules="[password_valide]"
		/>

		<v-text-field
			v-if="auth_local"
			:label="$t('inscription.confirmation')"
			v-model="confirmation"
			name="confirmation"
			type="password"
			variant="underlined"
			:rules="[confirmation_valide]"
		/>
		<v-checkbox
			v-if="!auth_local"
			:label="$t('login.persister')"
			v-model="persister"
			name="persister"
		/>
		<v-divider></v-divider>
		<v-card-actions>
			<v-spacer></v-spacer>
			<v-btn
				type="submit"
				color="success"
				:disabled="!authentificationPermise || !champs_valides"
				@click="inscrire"
			>
				{{$t('inscription.boutonInscription')}}
				<v-icon icon="mdi-chevron-right" end></v-icon>
			</v-btn>
		</v-card-actions>
	</fieldset>
</template>

<script src="./inscription.js" />
