var semaphores = [];

if (!navigator.locks) {
	console.warn("ATTENTION: les sémaphores du navigateur ne sont pas disponibles. La synchronisation des requêtes n'est pas garantie. cf: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API");
}
		
async function lock_maison(id, f) {
	if (!(id in semaphores) || !semaphores[id]) {
		semaphores[id] = new Promise((resolve) => {
			f().then((x)=>{
				delete semaphores[id];
				resolve(x);
			});
		});
	}

	return semaphores[id];
}

async function lock(id, f) {
	if (navigator.locks) {
		return navigator.locks.request(id, f);
	}
	else {
		return lock_maison(id, f);
	}
}

export {
	lock
};
