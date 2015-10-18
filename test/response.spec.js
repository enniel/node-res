'use strict'

/**
 * node-res
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Response = require('../src/Response')
const supertest  = require('co-supertest')
const http       = require('http')
const chai = require('chai')
const path = require('path')
const expect = chai.expect

require('co-mocha')

describe('Response', function () {

  it('should set response header', function * () {
    const server = http.createServer(function (req,res) {
      Response.header(res,'content-type','application/json')
      res.end()
    })
    const res = yield supertest(server).get('/').expect(200).expect('Content-Type', /json/).end()
  })

  it('should not set response header when already there by using safeHeader method', function * () {
    const server = http.createServer(function (req,res) {
      Response.header(res,'content-type','application/json')
      Response.safeHeader(res,'content-type','text/html')
      res.end()
    })
    const res = yield supertest(server).get('/').expect(200).expect('Content-Type', /json/).end()
  })

  it('should set an array of headers for a given field', function * () {
    const server = http.createServer(function (req,res) {
      Response.header(res,'Foo',['bar','baz'])
      res.end()
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.headers.foo).to.equal('bar, baz')
  })

  it('should set response status', function * () {
    const server = http.createServer(function (req,res) {
      Response.status(res,400)
      res.end()
    })
    const res = yield supertest(server).get('/').expect(400)
  })

  it('should send text back to client with proper headers', function * () {
    const server = http.createServer(function (req,res) {
      Response.send(res,'hello world')
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text).to.equal('hello world')
    expect(res.headers['content-type']).to.equal('text/html; charset=utf-8')
  })

  it('should send number back to client with proper headers', function * () {
    const server = http.createServer(function (req,res) {
      Response.send(res,1)
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text).to.equal('1')
    expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8')
  })

  it('should send json back to client with proper headers', function * () {
    const body = {
      name : 'foo',
      age: 22,
      nested: ['foo','bar']
    }
    const server = http.createServer(function (req,res) {
      Response.send(res,body)
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.body).deep.equal(body)
    expect(res.headers['content-type']).to.equal('application/json')
  })

  it('should send empty response', function * () {
    const body = ''
    const server = http.createServer(function (req,res) {
      Response.send(res,body)
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text).to.equal('')
    expect(res.headers['content-type']).to.equal('text/html; charset=utf-8')
  })

  it('should send empty response when request body is null', function * () {
    const body = null
    const server = http.createServer(function (req,res) {
      Response.send(res,body)
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text).to.equal('')
    expect(res.headers['content-type']).to.equal('text/html; charset=utf-8')
  })

  it('should send boolean as response', function * () {
    const body = true
    const server = http.createServer(function (req,res) {
      Response.send(res,body)
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text).to.equal('true')
    expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8')
  })

  it('should send buffer as response', function * () {
    const body = new Buffer('hello world', 'utf8')
    const server = http.createServer(function (req,res) {
      Response.send(res,body)
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text).to.equal('hello world')
    expect(res.headers['content-type']).to.equal('application/octet-stream')
  })

  it('should not override existing status by calling send method', function * () {
    const body = true
    const server = http.createServer(function (req,res) {
      Response.status(res, 204)
      Response.send(res, body)
    })
    const res = yield supertest(server).get('/').expect(204)
  })

  it('should send valid json response using json as shorthand method', function * () {
    const body = {
      foo: 'bar',
      baz: ['foo','bar']
    }
    const server = http.createServer(function (req,res) {
      Response.json(res, body)
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.body).deep.equal(body)
  })

  it('should send jsonp response back to client with default callback', function * () {
    const body = {
      name : 'foo',
      age: 22,
      nested: ['foo','bar']
    }
    const response = '/**/ typeof callback === \'function\' && callback('+JSON.stringify(body)+');'
    const server = http.createServer(function (req,res) {
      Response.jsonp(res,body)
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text).to.equal(response)
    expect(res.headers['content-type']).to.equal('text/javascript; charset=utf-8')
    expect(res.headers['x-content-type-options']).to.equal('nosniff')
  })

  it('should send jsonp response back to client with defined callback', function * () {
    const body = {
      name : 'foo',
      age: 22,
      nested: ['foo','bar']
    }
    const response = '/**/ typeof foo === \'function\' && foo('+JSON.stringify(body)+');'
    const server = http.createServer(function (req,res) {
      Response.jsonp(res,body,'foo')
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text).to.equal(response)
    expect(res.headers['content-type']).to.equal('text/javascript; charset=utf-8')
    expect(res.headers['x-content-type-options']).to.equal('nosniff')
  })

  it('should remove irrelevant headers when response status is 204 or 304', function * () {
    const body = 'hello world'
    const server = http.createServer(function (req,res) {
      Response.status(res,204)
      Response.send(res,body)
    })
    const res = yield supertest(server).get('/').expect(204)
    expect(res.headers['content-type']).to.equal(undefined)
    expect(res.headers['content-length']).to.equal(undefined)
  })

  it('should send file for download with proper headers', function * () {
    const server = http.createServer(function (req,res) {
      Response.download(res,path.join(__dirname,'./files/hello.txt'))
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text.trim()).to.equal('hello world')
    expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8')
    expect(res.headers['last-modified']).not.to.equal(undefined)
  })

  it('should send file to be force downloaded with proper headers', function * () {
    const server = http.createServer(function (req,res) {
      Response.attachment(res,path.join(__dirname,'./files/hello.txt'))
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.text.trim()).to.equal('hello world')
    expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8')
    expect(res.headers['last-modified']).not.to.equal(undefined)
    expect(res.headers['content-disposition']).to.equal('attachment; filename="hello.txt"')
  })

  it('should throw an error when file is not readable', function * () {
    const server = http.createServer(function (req,res) {
      Response.download(res,path.join(__dirname,'./files/foo.txt'))
    })
    const res = yield supertest(server).get('/').expect(503)
    expect(res.error.status).to.equal(503)
    expect(JSON.parse(res.error.text).code).to.equal("ENOENT")
  })

  it('should set location header on response', function * () {
    const server = http.createServer(function (req,res) {
      Response.location(res, 'http://localhost')
      Response.send(res, '')
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.headers['location']).to.equal('http://localhost')
  })

  it('should redirect to a given url', function * () {
    const server = http.createServer(function (req,res) {
      Response.redirect(res, 'http://localhost',301)
    })
    const res = yield supertest(server).get('/').expect(301)
    expect(res.headers['location']).to.equal('http://localhost')
    expect(res.headers['content-length']).to.equal('0')
  })

  it('should redirect with 302 when status is not defined', function * () {
    const server = http.createServer(function (req,res) {
      Response.redirect(res, 'http://localhost')
    })
    const res = yield supertest(server).get('/').expect(302)
    expect(res.headers['location']).to.equal('http://localhost')
    expect(res.headers['content-length']).to.equal('0')
  })

  it('should add vary header', function * () {
    const server = http.createServer(function (req,res) {
      Response.vary(res, 'Origin')
      Response.send(res, '')
    })
    const res = yield supertest(server).get('/').expect(200)
    expect(res.headers['vary']).to.equal('Origin')
  })


})
