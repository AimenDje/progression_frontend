const axios = require('axios');

// TODO : transporter vers services/index.js
const login_get_token = (user, password) => new Promise((resolve, reject) => {
    axios({ url: process.env.VUE_APP_API_URL + '/auth_token', auth: { username: user, password: password }, method: 'GET' })
        .then(resp => {
            const token = resp.data.auth_token
            localStorage.setItem('user-token', token)
            resolve(resp)
        })
        .catch(err => {
            localStorage.removeItem('user-token')
            reject(err)
        })
})

export default login_get_token;
