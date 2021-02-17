const axios = require('axios');
import './commun.js'

const getEbauche = (categorie, nom, titre, langage) => new Promise ((resolve, reject) => {
  axios({url: '{0}/question/{1}/{2}/{3}/solution?langage={4}'.format(process.env.VUE_APP_API_URL, categorie, nom, titre, langage), method: 'GET' })
  .then(resp => {
    resolve(resp.data.Solution.code)
  })
  .catch(err => {
    reject(err)
  })
})

// Temporairement GET parce que json server modifie le json lorsqu'un post est fait
const getRetroaction = () => new Promise ((resolve, reject) => {
  axios({url: '{0}/feedback'.format(process.env.VUE_APP_API_URL), data: {code: 'voici mon code'}, method: 'GET' })
  .then(resp => {
    resolve(resp.data.data.included.attributes.feedback)
  })
  .catch(err => {
    reject(err)
  })
})

export { getEbauche, getRetroaction };
