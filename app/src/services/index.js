import { getData, postData } from "@/services/request_services";

const BASE_URL = process.env.VUE_APP_API_URL;
const URL_VALIDER_TENTATIVE = process.env.VUE_APP_API_URL_VALIDATION_TENTATIVE

const getQuestionApi = async (urlQuestion) => {
    const question = {
        énoncé: null,
		titre: null,
        tests: [],
        ebauches: [],
        avancement:null
    }
    try {
        const data = await getData(BASE_URL + "/question/" + urlQuestion + "?include=tests,ebauches");
        question.énoncé = data.data.attributes.énoncé;
		question.titre = data.data.attributes.titre;
		question.liens = [ data.data.links ];
        data.included.forEach( (item) => {
			if(item.type=="test")
				question.tests.push(item.attributes);
			if(item.type=="ebauche")
				question.ebauches[item.attributes.langage] = item.attributes;
			
		});
        return question;
    } catch (err) {
        console.log(err);
    }
}

const getAvancementApi = async (username, urlQuestion) => {
	const avancement = {
		état: false,
		type: 0,
		tentatives: []
	}
    try {
        const data = await getData(BASE_URL + "/avancement/" + username + "/" + urlQuestion + "?include=tentatives");
		avancement.état = data.data.attributes.état;
		avancement.type = data.data.attributes.type;
		data.included.forEach( (item) => {
			avancement.tentatives.push( item.attributes );
		});
        return avancement;
    } catch (err) {
        console.log(err);
    }
}

const getTentativeApi = async (urlTentative) => {
    try {
        const tentative = await getData(urlTentative);
        const resultatsId = tentative.data.résultats;
        let resultats = [];
        for (const resultat of resultatsId) {
            resultats.push(await getData(tentative.data.lienResultat + resultat.id));
        }

        const tentativeComplete = {
            tentative: tentative.data,
            resultats: resultats
        }
        return tentativeComplete;
    } catch (err) {
        console.log(err);
    }
}
const postTentative = async (unLangage, unCode) => {
    try {
        const retroaction = await postData(URL_VALIDER_TENTATIVE, { langage: unLangage, code: unCode })
        const maRetroaction = {
            tests_réussis: false,
            feedback_global: "",
            resultats: []
        }
        maRetroaction.tests_réussis = retroaction.attributes.tests_réussis
        maRetroaction.feedback_global = retroaction.attributes.feedback
        retroaction.included.forEach( (item) => {
            maRetroaction.resultats.push(item.attributes);
        });
        return maRetroaction;
    } catch (err) {
        console.log(err);
    }
}

export { getQuestionApi, getTentativeApi, getAvancementApi, postTentative };


