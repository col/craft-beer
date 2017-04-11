# Craft Beer

## Example Usage

```
var CraftBeer = require("./index.js")

var token = null

CraftBeer.login("jsmith@example.com", "password")
.then((sessionToken) => {
  token = sessionToken;
  console.log("Login successful. Token="+sessionToken)
  return CraftBeer.addToCart(token, 133) // Product Id
})
.then(() => {
  console.log("Item added to cart")
  return CraftBeer.checkoutStep1(token, 567) // Existing Address Id
})
.then((shippingMethod) => {
  console.log("Checkout step 1 successful")
  return CraftBeer.checkoutStep2(token, shippingMethod)
})
.then(() => {
  console.log("Checkout step 2 successful")
  return CraftBeer.checkoutStep3(token)
})
.then((orderToken) => {
  console.log("Checkout step 3 successful")
  return CraftBeer.checkoutStep4(token, orderToken, "John Smith", "AMEX", "123456789", "01", "20", "123")
})
.then(() => {
  console.log("Order Complete!")
})
.catch((error) => {
  console.log("Error = " + error)
})
```
