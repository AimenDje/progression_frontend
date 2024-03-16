<template>
	<v-container>
		<v-row>
			<v-col>
				<v-tabs v-model="tabSélectionné">
					<v-tab
						v-if="auth_ldap"
						value="LDAP"
						class="text-lowercase"
					>
						{{ldap_domaine}}
					</v-tab>

					<v-tab
						v-if="auth_local"
						value="STANDARD"
					>
						{{ $t('login.standard') }}
					</v-tab>

					<v-tab
						v-if="inscription_locale"
						value="INSCRIPTION"
					>
						{{ $t('login.inscription') }}
					</v-tab>
				</v-tabs>

				<div>
					<v-window
						v-model="tabSélectionné">
						<v-window-item
							value="LDAP"
						>
							<LoginForm
								v-if="auth_ldap"
								:domaine="ldap_domaine"
								:url_mdp_reinit="ldap_url_mdp_reinit"
								:focus="tabSélectionné=='LDAP'"
								@onLogin="onLogin"
							/>
						</v-window-item>
							
						<v-window-item
							value="STANDARD"
						>
							<LoginForm
								v-if="auth_local"
								:focus="tabSélectionné=='STANDARD'"
								@onLogin="onLogin"
							/>
						</v-window-item>
						<v-window-item
							value="INSCRIPTION"
						>
							<Inscription
								v-if="inscription_locale"
								:focus="tabSélectionné=='INSCRIPTION'"
								@onInscrire="onInscrire"
							/>
						</v-window-item>
					</v-window>
				</div>
			</v-col>
		</v-row>
	</v-container>
</template>

<script src="./login.js"></script>

<style scoped src="./login.css"></style>
