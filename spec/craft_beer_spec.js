'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const request = require('request-promise')
const Promise = require('bluebird')
const CraftBeer = require('../lib/craft_beer')

describe('craft_beer', () => {

  describe('#login', () => {
    var postStub = null

    describe('when successful', () => {
      beforeEach(() => {
        postStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 302, headers:{location: "http://www.example.com/account.php", 'set-cookie': ['SHOP_SESSION_TOKEN=abcd1234;']}}));
      })

      afterEach(() => {
        postStub.restore()
      })

      it('should return the session token', (done) => {
        CraftBeer.login("username", "password").then((token) => {
          check(done, () => { expect(token).to.equal("abcd1234") })
        }).catch(() => {
          check(done, () => { expect(false).to.equal(true) })
        })
      })
    })

    describe('when unsuccessful', () => {
      beforeEach(() => {
        postStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 302, headers:{location: "http://www.example.com/login"}}));
      })

      afterEach(() => {
        postStub.restore()
      })

      it('should return an error message', (done) => {
        CraftBeer.login("username", "password").then(() => {
          check(done, () => { expect(false).to.equal(true) })
        }).catch((error) => {
          check(done, () => { expect(error).to.equal("Login failed") })
        })
      })
    })

  })

  describe('#addToCart', () => {
    var getStub = null

    describe('when successful', () => {
      beforeEach(() => {
        getStub = sinon.stub(request, 'get').returns(Promise.resolve({statusCode: 200, body: "{ \"success\": true }"}));
      })

      afterEach(() => {
        getStub.restore()
      })

      it('should be successful', (done) => {
        CraftBeer.addToCart("token", "123").then(() => {
          done()
        }).catch(() => {
          check(done, () => { expect(false).to.equal(true) })
        })
      })
    })

    describe('when unsuccessful', () => {
      beforeEach(() => {
        getStub = sinon.stub(request, 'get').returns(Promise.resolve({statusCode: 200, body: "{ \"success\": false }"}));
      })

      afterEach(() => {
        getStub.restore()
      })

      it('should return an error', (done) => {
        CraftBeer.addToCart("token", "invalid").then(() => {
          check(done, () => { expect(false).to.equal(true) })
        }).catch((error) => {
          done()
        })
      })
    })

  })

  describe('#checkoutStep1', () => {
    var requestStub = null

    describe('when successful', () => {
      beforeEach(() => {
        var stepContent = JSON.stringify([{id: "ShippingProvider", content: "... selectedShippingMethod[randomStr] ..."}])
        requestStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 200, body: "{ \"status\": 1, \"stepContent\": "+stepContent+" }"}));
      })

      afterEach(() => {
        requestStub.restore()
      })

      it("should be successful and return the shipping method identifier", (done) => {
        CraftBeer.checkoutStep1("token", 123).then((shippingMethod) => {
          check(done, () => { expect(shippingMethod).to.equal("selectedShippingMethod[randomStr]") })
        }).catch(() => {
          check(done, () => { expect(false).to.equal(true) })
        })
      })
    })

    describe('when unsuccessful', () => {
      beforeEach(() => {
        requestStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 200, body: "{ \"status\": 0 }"}));
      })

      afterEach(() => {
        requestStub.restore()
      })

      it("should return an error message", (done) => {
        CraftBeer.checkoutStep1("token", 123).then(() => {
          check(done, () => { expect(false).to.equal(true) })
        }).catch(() => {
          done()
        })
      })
    })

  })

  describe('#checkoutStep2', () => {
    var requestStub = null

    describe('when successful', () => {
      beforeEach(() => {
        requestStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 200, body: "{ \"status\": 1 }"}));
      })

      afterEach(() => {
        requestStub.restore()
      })

      it("should be successful", (done) => {
        CraftBeer.checkoutStep2("token", "shippingMethod[abc]").then(() => {
          done()
        }).catch(() => {
          check(done, () => { expect(false).to.equal(true) })
        })
      })
    })

    describe('when unsuccessful', () => {
      beforeEach(() => {
        requestStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 200, body: "{ \"status\": 0 }"}));
      })

      afterEach(() => {
        requestStub.restore()
      })

      it("should return an error message", (done) => {
        CraftBeer.checkoutStep2("token", "shippingMethod[abc]").then(() => {
          check(done, () => { expect(false).to.equal(true) })
        }).catch(() => {
          done()
        })
      })
    })

  })

  describe('#checkoutStep3', () => {
    var requestStub = null

    afterEach(() => {
      requestStub.restore()
    })

    describe('when successful', () => {
      beforeEach(() => {
        requestStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 200, body: "{ \"status\": 1 }", headers:{'set-cookie': ['SHOP_ORDER_TOKEN=xyz789;']}}));
      })

      it("should be successful", (done) => {
        CraftBeer.checkoutStep3("token").then((orderToken) => {
          check(done, () => { expect(orderToken).to.equal("xyz789") })
        }).catch(() => {
          check(done, () => { expect(false).to.equal(true) })
        })
      })
    })

    describe('when unsuccessful', () => {
      beforeEach(() => {
        requestStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 200, body: "{ \"status\": 0 }"}));
      })

      it("should return an error message", (done) => {
        CraftBeer.checkoutStep3("token").then((_orderToken) => {
          check(done, () => { expect(false).to.equal(true) })
        }).catch(() => {
          done()
        })
      })
    })

  })

  describe('#checkoutStep4', () => {
    var requestStub = null

    afterEach(() => {
      requestStub.restore()
    })

    describe('when successful', () => {
      beforeEach(() => {
        requestStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 320, body: "...", headers:{location: "http://www.example.com/finishorder.php"}}));
      })

      it("should be successful", (done) => {
        CraftBeer.checkoutStep4("token", "John Smith", "AMEX", "1234567890", "01", "20", "123").then(() => {
          done()
        }).catch(() => {
          check(done, () => { expect(false).to.equal(true) })
        })
      })
    })

    describe('when unsuccessful', () => {
      beforeEach(() => {
        requestStub = sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 320, body: "...", headers:{location: "http://www.example.com/cart.php"}}));
      })

      it("should return an error message", (done) => {
        CraftBeer.checkoutStep4("token", "John Smith", "AMEX", "1234567890", "01", "20", "123").then(() => {
          check(done, () => { expect(false).to.equal(true) })
        }).catch(() => {
          done()
        })
      })
    })

  })

})

function check(done, func) {
  try {
    func()
    done()
  } catch(e) {
    done(e)
  }
}
