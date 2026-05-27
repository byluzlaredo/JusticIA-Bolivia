import json
import urllib.request
import urllib.error

url = 'http://127.0.0.1:8000/api/auth/register'
body = json.dumps({'nombre':'Test','apellido':'User','correo':'test@legal.local','contrasena':'Test1234'}).encode('utf-8')
req = urllib.request.Request(url, data=body, headers={'Content-Type':'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as r:
        print(r.status)
        print(r.read().decode())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode())
