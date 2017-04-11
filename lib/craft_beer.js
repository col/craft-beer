"use strict"

const util = require('util')
const request = require('request-promise')
const Cookie = require('tough-cookie').Cookie

const BASE_URL = "https://store-736be.mybigcommerce.com"

function inspect(obj) {
  return util.inspect(obj, false, null)
}

function getCookieValue(cookies, cookieName) {
  var matchedCookies = cookies.filter((cookie) => { return cookie.startsWith(cookieName+'=') })
  return matchedCookies.length > 0 ? Cookie.parse(matchedCookies[0]).value : null
}

function login(username, password) {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'POST',
      uri: BASE_URL+'/login.php?action=check_login',
      resolveWithFullResponse: true,
      simple: false,
      form: {login_email: username, login_pass: password}
    }
    request.post(options).then((response) => {
      var locationHeader = response.headers.location
      console.log("status = " + response.statusCode)
      console.log("location = " + locationHeader)
      if(response.statusCode == 302 && locationHeader.endsWith("/account.php")) {
        resolve(getCookieValue(response.headers["set-cookie"], "SHOP_SESSION_TOKEN"))
      } else {
        reject("Login failed")
      }
    }).catch((error) => {
      reject("Login failed")
    })
  })
}

module.exports = {
  login: login
}
