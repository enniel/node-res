# Node Res

![](http://i1117.photobucket.com/albums/k594/thetutlage/poppins-1_zpsg867sqyl.png)

`node-res` exposes helper methods to constructor different http response. It supports almost every method from `express` but is just an I/O module.


## See also

1. node-req
2. node-cookie

## Responding to requests.

```javascript
const http = require('http')
const nodeRes = require('node-res')

http.createServer(function (req, res) {
  
  // plain text
  nodeRes.send(res, "Hello world")

  // json
  nodeRes.json(res, {time:"now"})

  // jsonp
  nodeRes.jsonp(res, {time:"now"}, "callback")

}).listen(3000)

```

nodeRes takes http server `res` object as first argument to perform any operation.

## Methods

#### header (res, key, value)

```javascript
nodeRes.header(res, 'Content-Type', 'text/html')
```

#### removeHeader (res, key)

```
nodeRes.removeHeader(res, 'Content-type')
```

#### getHeader (res, key)

```
nodeRes.getHeader(res, 'Content-type')
```

#### status (res, statusCode)

```javascript
nodeRes.status(res, 200)
```

#### send(res, body)

```javascript
nodeRes.send(res, {user:"someone"})
```

#### json (res, body)
`send` method is fully capable of making json responses, it is an alias method for readability.

```javascript
nodeRes.json(res, {user:"someone"})
```

#### jsonp (res, body, callback="callback")

```javascript
nodeRes.jsonp(res, {user:"someone"}, "angular")
```

#### download (res, filePath)

```javascript
nodeRes.download(res, 'fullPathToFile')
```

#### attachment (res, filePath, name?, disposition=attachment?)

force download

```javascript
nodeRes.attachment(res, 'fullPathToFile')
nodeRes.attachment(res, 'fullPathToFile', 'downloadName')
nodeRes.attachment(res, 'fullPathToFile', 'downloadName', 'disposition=attachment')
```

#### location (res, url)

sets location header on request

```javascript
nodeRes.location(res, 'http://example.org')
```

#### redirect (res, url, status=302?)

redirects to given url after setting location header

```javascript
nodeRes.redirect(res, 'http://example.com', 301)
```

#### vary (res, field)

Adds vary header to response, if it is not there already.

```javascript
nodeRes.vary(res, 'Accept')
```

## License 
(The MIT License)

Copyright (c) 2015 Poppins

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
