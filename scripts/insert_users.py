import os
import sys
from api.auth import get_password_hash
import psycopg2
import bcrypt

# Configuración de conexión (de docker-compose.yml)
DB_HOST = os.getenv('LABORAL_HOST', 'localhost')
DB_PORT = int(os.getenv('LABORAL_PORT', 5433))
DB_NAME = os.getenv('LABORAL_DB', 'sistema_laboral')
DB_USER = os.getenv('LABORAL_USER', 'laboral_user')
DB_PASS = os.getenv('LABORAL_PASSWORD', 'laboral_password')

USERS = [
    {"nombre": "Admin", "apellido": "Demo", "correo": "admin@legal.com", "contrasena": "AdminPass123!", "rol": "admin"},
    {"nombre": "Juan", "apellido": "Perez", "correo": "juan@ejemplo.com", "contrasena": "MiPass123", "rol": "usuario"},
    {"nombre": "Maria", "apellido": "Lopez", "correo": "maria@ejemplo.com", "contrasena": "OtraPass123", "rol": "usuario"},
]


def main():
    try:
        conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    except Exception as e:
        print("ERROR: no se pudo conectar a la base de datos:", e)
        sys.exit(1)

    cur = conn.cursor()

    for u in USERS:
        cur.execute("SELECT id_usuario FROM usuario WHERE correo = %s", (u['correo'],))
        if cur.fetchone():
            print(f"SALTADO (ya existe): {u['correo']}")
            continue

        try:
            hashed = get_password_hash(u['contrasena'])
        except Exception:
            # fallback directo con bcrypt si passlib falla
            hashed = bcrypt.hashpw(u['contrasena'].encode('utf-8'), bcrypt.gensalt()).decode()

        try:
            cur.execute(
                "INSERT INTO usuario (nombre, apellido, correo, contrasena, rol) VALUES (%s, %s, %s, %s, %s) RETURNING id_usuario",
                (u['nombre'], u['apellido'], u['correo'], hashed, u.get('rol', 'usuario'))
            )
            uid = cur.fetchone()[0]
            conn.commit()
            print(f"INSERTADO id={uid} correo={u['correo']} rol={u.get('rol','usuario')}")
        except Exception as e:
            conn.rollback()
            print(f"ERROR insertando {u['correo']}:", e)

    # Mostrar usuarios insertados
    cur.execute("SELECT id_usuario, nombre, apellido, correo, rol, activo FROM usuario ORDER BY id_usuario DESC LIMIT 10")
    rows = cur.fetchall()
    print('\nUsuarios recientes:')
    for r in rows:
        print(r)

    cur.close()
    conn.close()


if __name__ == '__main__':
    main()
