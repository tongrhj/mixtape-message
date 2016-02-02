'use strict'

const express = require('express')
// const bodyParser = require('body-parser')
// const cors = require('cors')
const request = require('request')
const querystring = require('querystring')
const cookieParser = require('cookie-parser')

const app = express()

const client_id = process.env.SPOTIFY_CLIENT_ID
const client_secret = process.env.SPOTIFY_CLIENT_SECRET
const redirect_uri = 'http://localhost:8888/callback' // set in developer.spotify.com

// const stateKey = 'spotify_auth_state'

// app.use(cors())
app.use(express.static('public'))
   .use(cookieParser())

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname })
})

app.get('/login', (req, res) => {
  // res.cookie(stateKey)
  const scope = 'playlist-modify-public'
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
    }))
})

app.get('/callback', (req, res) => {
  const code = req.query.code || null
  // const storedState = req.cookies ? req.cookies[stateKey] : null

  // res.clearCookie(stateKey)
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  }

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token
      const refresh_token = body.refresh_token
      const options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      }
      // use the access token to access the Spotify Web API
      request.get(options, (error, response, body) => {
        if (error) {
          console.log(error)
        } else {
          console.log(body)
        }
      })

      // we can also pass the token to the browser to make requests from there
      res.redirect('/#' +
        querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token
        }))
    } else {
      res.redirect('/#' +
        querystring.stringify({
          error: 'invalid_token'
        }))
    }
  })
})

app.get('/refresh_token', (req, res) => {
  const refresh_token = req.query.refresh_token
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  }

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token
      res.send({
        'access_token': access_token
      })
    }
  })
})

module.exports = app
