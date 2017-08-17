var CraftBeer = require("./index.js")

var username = process.env.CRAFTBEER_USERNAME
var password = process.env.CRAFTBEER_PASSWORD
var addressId = process.env.CRAFTBEER_ADDRESS_ID
var creditCardName = process.env.CRAFTBEER_CC_NAME
var creditCardType = process.env.CRAFTBEER_CC_TYPE
var creditCardNumber = process.env.CRAFTBEER_CC_NUMBER
var creditCardExpiryMonth = process.env.CRAFTBEER_CC_EXPIRY_MONTH
var creditCardExpiryYear = process.env.CRAFTBEER_CC_EXPIRY_YEAR
var creditCardCCV = process.env.CRAFTBEER_CC_CCV

var token = null

CraftBeer.login(username, password)
.then((sessionToken) => {
  token = sessionToken;
  console.log("Login successful. Token="+sessionToken)
  return CraftBeer.addToCart(token, 133) // Product Id
})
.then(() => {
  console.log("Item added to cart")
  return CraftBeer.checkout(
    token,
    addressId,
    creditCardName,
    creditCardType,
    creditCardNumber,
    creditCardExpiryMonth,
    creditCardExpiryYear,
    creditCardCCV
  )
})
.then(() => {
  console.log("Order Complete!")
})
.catch((error) => {
  console.log("Error = " + error)
})
