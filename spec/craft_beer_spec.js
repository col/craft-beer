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
        sinon.stub(request, 'post').returns(Promise.resolve({statusCode: 302, headers:{location: "http://www.example.com/login"}}));
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

})
