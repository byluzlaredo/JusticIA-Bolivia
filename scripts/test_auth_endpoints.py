import json
import urllib.request
import urllib.error

def request(url, payload):
    body = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={'Content-Type':'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

register_url = 'http://127.0.0.1:8000/api/auth/register'
login_url = 'http://127.0.0.1:8000/api/auth/login'
print('REGISTER:', request(register_url, {'nombre':'Prueba','apellido':'Usuario','correo':'prueba@example.com','contrasena':'Prueba1234'}))
print('LOGIN:', request(login_url, {'correo':'juan@ejemplo.com','contrasena':'MiPass123'}))
