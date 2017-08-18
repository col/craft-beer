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

function checkout(token, addressId, creditCardName, creditCardType, creditCardNumber, creditCardExpiryMonth, creditCardExpiryYear, creditCardCCV) {

  return checkoutStep1(token, addressId)
  .then((shippingMethod) => {
    console.log("Checkout step 1 successful")
    console.log("shippingMethod:", shippingMethod)
    return checkoutStep2(token, shippingMethod)
  })
  .then(() => {
    console.log("Checkout step 2 successful")
    return checkoutStep3(token)
  })
  .then((orderToken) => {
    console.log("Checkout step 3 successful")
    console.log("Order Token:", orderToken)
    return checkoutStep4(
      token,
      orderToken,
      creditCardName,
      creditCardType,
      creditCardNumber,
      creditCardExpiryMonth,
      creditCardExpiryYear,
      creditCardCCV
    )
    return
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
  return sendPostRequest("/remote.php", token, "", formData, (resolve, reject, response) => {
    var data = JSON.parse(response.body)
    data.status == 1 ? resolve(extractShippingMethod(data)) : reject()
  })
}

function checkoutStep2(token, shippingMethod) {
  var formData = { w: "saveExpressCheckoutShippingProvider" }
  formData[shippingMethod] = 0
  return sendPostRequest("/remote.php", token, "", formData, (resolve, reject, response) => {
    JSON.parse(response.body).status == 1 ? resolve() : reject()
  })
}

function checkoutStep3(token) {
  var formData = {
    action: "pay_for_order",
    couponcode: "Code",
    store_credit: 1,
    checkout_provider: "checkout_stripe",
    ordercomments: ""
  }
  return sendPostRequest("/checkout.php", token, "", formData, (resolve, reject, response) => {
    var orderToken = getCookieValue(response.headers["set-cookie"], "SHOP_ORDER_TOKEN")
    if(response.statusCode == 200 && orderToken) {
      resolve(orderToken)
    } else {
      reject()
    }
  })
}

function checkoutStep4(token, orderToken, name, cardType, cardNumber, cardExpiryMonth, cardExpiryYear, cardCCV) {
  var formData = {
    creditcard_cctype: cardType,
    creditcard_name: name,
    creditcard_ccno: cardNumber,
    creditcard_issueno: "",
    creditcard_issuedatem: "",
    creditcard_issuedatey: "",
    creditcard_ccexpm: cardExpiryMonth,
    creditcard_ccexpy: cardExpiryYear,
    creditcard_cccvd: cardCCV
  }
  return sendPostRequest("/checkout.php?action=process_payment", token, orderToken, formData, (resolve, reject, response) => {
    if (response.statusCode == 302 && response.headers.location.endsWith("finishorder.php")) {
      resolve()
    } else {
      console.log("CheckoutStep4 Failed")
      reject()
    }
  })
}

function sendPostRequest(path, token, orderToken, formData, callback) {
  return new Promise((resolve, reject) => {
    var options = {
      uri: BASE_URL+path,
      headers: { 'Cookie': `SHOP_SESSION_TOKEN=${token}; SHOP_ORDER_TOKEN=${orderToken};` },
      resolveWithFullResponse: true,
      simple: false,
      form: formData
    }
    console.log("Sending: ", formData)
    request.post(options).then((response) => {
      callback(resolve, reject, response)
    }).catch((error) => {
      console.log("Error: ", error)
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
  checkout: checkout,
  checkoutStep1: checkoutStep1,
  checkoutStep2: checkoutStep2,
  checkoutStep3: checkoutStep3,
  checkoutStep4: checkoutStep4
}
