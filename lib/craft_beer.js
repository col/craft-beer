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
      uri: BASE_URL+'/login.php?action=check_login',
      resolveWithFullResponse: true,
      simple: false,
      form: {login_email: username, login_pass: password}
    }
    request.post(options).then((response) => {
      var locationHeader = response.headers.location
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

function addToCart(token, productId) {
  return new Promise((resolve, reject) => {
    var options = {
      uri: BASE_URL+`/cart.php?action=add&product_id=${productId}&fastcart=1`,
      headers: {
        'Cookie': `SHOP_SESSION_TOKEN=${token};`
      },
      resolveWithFullResponse: true,
      simple: false
    }
    request.get(options).then((response) => {
      var data = JSON.parse(response.body)
      if(data.success) {
        resolve()
      } else {
        reject()
      }
    }).catch((error) => {
      reject()
    })
  })
}

function checkoutStep1(token, billingAddressId) {
  var formData = {
    w: "saveExpressCheckoutBillingAddress",
    BillingAddressType: "existing",
    sel_billing_address: billingAddressId,
    ship_to_billing_existing: 1,
    save_billing_address: 1,
    ship_to_billing_new: 1,
    BillingAddressType: "existing"
  }
  return checkoutStep(token, formData, (resolve, reject, response) => {
    var data = JSON.parse(response.body)
    data.status == 1 ? resolve(extractShippingMethod(data)) : reject()
  })
}

function checkoutStep2(token, shippingMethod) {
  var formData = { w: "saveExpressCheckoutShippingProvider" }
  formData[shippingMethod] = 0
  return checkoutStep(token, formData, (resolve, reject, response) => {
    JSON.parse(response.body).status == 1 ? resolve() : reject()
  })
}

function checkoutStep(token, formData, callback) {
  return new Promise((resolve, reject) => {
    var options = {
      uri: BASE_URL+`/remote.php`,
      headers: { 'Cookie': `SHOP_SESSION_TOKEN=${token};` },
      resolveWithFullResponse: true,
      simple: false,
      form: formData
    }
    request.post(options).then((response) => {
      callback(resolve, reject, response)
    }).catch((error) => {
      reject()
    })
  })
}

function extractShippingMethod(data) {
  var shippingProvider = data.stepContent.filter((step) => { return step.id == "ShippingProvider" })[0]
  var match = shippingProvider.content.match(/selectedShippingMethod\[.*?\]/)
  return match[0]
}

module.exports = {
  login: login,
  addToCart: addToCart,
  checkoutStep1: checkoutStep1,
  checkoutStep2: checkoutStep2
}
