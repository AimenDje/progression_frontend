import axios from "axios";

async function getData(url, query = null, token = null, config = null) {
	let conf = {
		url: url,
		params: query,
		...config
	};

	if (token) {
		conf.headers = { Authorization: "Bearer " + token };
	}

	const réponse = await axios.request(conf);
	return réponse.data;
}

async function postData(url, query = null, data = null, token = null, config = null) {
	let conf = {
		url: url,
		method: "post",
		params: query,
		data: data,
		...config
	};

	if (token) {
		conf.headers = { Authorization: "Bearer " + token };
	}

	const réponse = await axios.request(conf);
	return réponse.data;
}

export { getData, postData };
