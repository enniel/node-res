'use strict'

/**
 * node-res
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const mime               = require('mime')
const etag               = require('etag')
const fs                 = require('fs')
const contentDisposition = require('content-disposition')
const vary               = require('vary')

/**
 * @description Utility class that makes eaiser to
 * send http response.
 * @module Response
 * @type {Object}
 */
let Response = exports = module.exports = {}

/**
 * @description sets response header on http response
 * object
 * @method header
 * @param  {Object} res
 * @param  {String} key
 * @param  {Mixed} value
 * @return {void}
 * @example
 *   Response.set('foo','bar')
 *   Response.set('foo',['bar','baz'])
 * @public
 */
Response.header = function (res, key, value) {
  const charsetRegExp = /;\s*charset\s*=/

  value = Array.isArray(value) ? value.map(String) : String(value)

  /**
   * setting up charset on content-type header
   * @example
   *   text/plain will become text/plain; charset=utf-8
   */
  if(key.toLowerCase() === 'content-type' && !charsetRegExp.test(value)){
    const charset = mime.charsets.lookup(value.split(';')[0])
    if(charset){
      value += '; charset=' + charset.toLowerCase()
    }
  }

  res.setHeader(key, value)
}

/**
 * @description sets response status code
 * @method status
 * @param  {Object} res
 * @param  {Number} code
 * @return {void}
 */
Response.status = function (res, code) {
  res.statusCode = code
}

/**
 * @description set response header if same
 * @method safeHeader
 * @see  Response.header
 */
Response.safeHeader = function (res, key, value) {
  if(!res.getHeader(key)){
    Response.header(res,key, value)
  }
}

/**
 * @description removing header using it's key
 * @method removeHeader
 * @param  {Object}     res
 * @param  {String}     key
 * @return {void}
 */
Response.removeHeader = function (res, key) {
  res.removeHeader(key)
}

/**
 * @description writing to response object
 * @method write
 * @param  {Object} res
 * @param  {Mixed} body
 * @return {void}
 */
Response.write = function (res, body) {
  res.write(body)
}

/**
 * @description ending response, after this adding
 * headers or body will not work.
 * @method end
 * @param  {Object} res
 * @return {void}
 */
Response.end = function (res) {
  res.end()
}

/**
 * @description sends request body by writing
 * it on http response object.
 * @method send
 * @param  {Object} res
 * @param  {Mixed} body
 * @return {void}
 */
Response.send = function (res, body) {

  let chunk = body || ''
  let type,contentType

  /**
   * switching over data type and formatting data
   * to be sent on http response.
   */
  switch(typeof chunk){
    case 'string':
      type = 'html'
      break;
    case 'boolean':
    case 'number':
      type = 'text'
      chunk = String(chunk)
      break;
    case 'object':
      if(Buffer.isBuffer(chunk)){
        type = 'bin'
      }else{
        type = 'json'
        chunk = JSON.stringify(chunk)
      }
      break;
  }

  contentType = mime.lookup(type)

  /**
   * setting up content type on response headers
   */
  Response.safeHeader(res, 'Content-Type', contentType)

  /**
   * setting up content length on response headers
   */
  if(chunk){
    if (!Buffer.isBuffer(chunk)) {
      chunk = new Buffer(chunk);
    }
    const length = chunk.length;
    Response.header(res, 'Content-Length', length);
  }

  /**
   * generating and setting etag
   */
  Response.safeHeader(res, 'ETag', etag(chunk))

  /**
   * removing unneccessary headers if response
   * has certain statusCode
   */
  if(res.statusCode === 204 || res.statusCode === 304){
    Response.removeHeader(res, 'Content-Type')
    Response.removeHeader(res, 'Content-Length')
    Response.removeHeader(res, 'Transfer-Encoding')
  }

  Response.write(res, chunk)
  Response.end(res)
}

/**
 * @description make json response with proper
 * content type header
 * @method json
 * @param  {Object} res
 * @param  {Mixed} body
 * @return {void}
 */
Response.json = function (res, body) {
  Response.safeHeader(res, 'Content-Type','application/json')
  Response.send(res, body)
}

/**
 * @description makes valid jsonp response with given
 * callback
 * @method jsonp
 * @param  {Object}   res
 * @param  {Mixed}   body
 * @param  {Function} callback
 * @return {void}
 */
Response.jsonp = function (res, body, callback) {

  callback = callback || 'callback'

  Response.header(res ,'X-Content-Type-Options', 'nosniff')
  Response.safeHeader(res, 'Content-Type', 'text/javascript')

  body = JSON.stringify(body)

  /**
   * replacing non-allowed javascript characters from body
   */
  body = body
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029')

  /**
   * setting up callback on response body , typeof will make
   * sure not to throw error of client if callback is not
   * a function
   */
  body = '/**/ typeof ' + callback + ' === \'function\' && ' + callback + '(' + body + ');'

  Response.send(res, body)
}

/**
 * @description sending file to the client as response, it
 * creates a readable stream and pipe it response.
 * @method _sendFile
 * @param  {Object}  res
 * @param  {String}  filePath
 * @return {void}
 * @private
 */
Response._sendFile = function (res, filePath) {
  let readStream

  /**
   * executed on error
   * @method onError
   * @param  {Object} errorStack
   */
  function onError (errorStack) {
    Response.status(res, 503)
    Response.send(res, errorStack)
    Response.end(res)
  }

  function onEnd() {
    res.end()
  }

  /**
   * making sure stream is readable before piping it through
   * response.
   * @method onceReadable
   */
  function onceReadable () {
    const contentType = mime.lookup(filePath)
    Response.safeHeader(res, 'Content-Type', contentType)
    readStream.pipe(res)
  }

  function createStream () {
    readStream = fs.createReadStream(filePath)
    readStream.on('readable', onceReadable)
    readStream.on('end',onEnd)
    readStream.on('error', onError)
  }

  fs.stat (filePath, function (err, stats) {
    if(err){
      return onError (err)
    }
    Response.header(res, 'Last-Modified', stats.mtime)
    Response.header(res, 'Content-Length', stats.size)
    createStream()
  })
}

/**
 * @description sending file as response to client
 * @method download
 * @param  {Object} res
 * @param  {String} filePath
 * @return {void}
 */
Response.download = function (res, filePath) {
  Response._sendFile (res, filePath)
}

/**
 * @description force downloading files by setting up
 * content disposition header
 * @method attachment
 * @param  {Object}   res
 * @param  {String}   filePath
 * @param  {String}   name
 * @param  {String}   disposition
 * @return {void}
 */
Response.attachment = function (res, filePath, name, disposition) {
  name = name || filePath
  disposition = disposition || 'attachment'

  Response.header(
    res, 'Content-Disposition', contentDisposition(name, {type:disposition})
  )
  Response._sendFile(res, filePath)
}

/**
 * @description sets location header on response
 * @method location
 * @param  {Object} res
 * @param  {String} url
 * @return {void}
 */
Response.location = function (res, url) {
  Response.header(res, 'Location', url)
}

/**
 * @description redirects to a given url by setting
 * up location header
 * @method redirect
 * @param  {Object} res
 * @param  {String} url
 * @param  {Number} status
 * @return {void}
 */
Response.redirect = function (res, url, status) {
  status = status || 302
  const body = ''
  Response.status(res, status)
  Response.location(res, url)
  Response.header(res, 'Content-Length', Buffer.byteLength(body))
  Response.send(res, body)
}

/**
 * adds vary header for a given field
 * @method vary
 * @param  {Object} res
 * @param  {String} field
 * @return {void}
 */
Response.vary = function (res, field) {
  vary(res, field)
}
