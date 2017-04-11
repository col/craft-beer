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
          expect(token).to.equal("abcd1234")
          done()
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
        CraftBeer.login("username", "password").catch((error) => {
          expect(error).to.equal("Login failed")
          done()
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
        }).catch((error) => {
          expect(false).to.equal(true)
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
          expect(false).to.equal(true)
        }).catch((error) => {
          done()
        })
      })
    })

  })

})
