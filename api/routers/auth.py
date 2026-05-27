from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from api.models import UserRegister, UserLogin
from api.database import get_laboral_connection
from api.auth import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from jose import JWTError, jwt

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    conn = get_laboral_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuario WHERE correo = %s", (correo,))
    user = cur.fetchone()
    conn.close()
    
    if user is None:
        raise credentials_exception
    return user

@router.post("/register")
async def register(user: UserRegister):
    conn = get_laboral_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id_usuario FROM usuario WHERE correo = %s", (user.correo,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
        
    hashed_pwd = get_password_hash(user.contrasena)
    try:
        cur.execute("""
            INSERT INTO usuario (nombre, apellido, correo, contrasena, rol)
            VALUES (%s, %s, %s, %s, 'usuario')
        """, (user.nombre, user.apellido, user.correo, hashed_pwd))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        
    return {"message": "Usuario registrado exitosamente"}

@router.post("/login")
async def login(user: UserLogin):
    conn = get_laboral_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuario WHERE correo = %s", (user.correo,))
    db_user = cur.fetchone()
    conn.close()
    
    if not db_user or not verify_password(user.contrasena, db_user["contrasena"]):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
    access_token = create_access_token(data={"sub": db_user["correo"]})
    return {"access_token": access_token, "token_type": "bearer", "user": {"nombre": db_user["nombre"], "correo": db_user["correo"]}}

# Endpoint standard de OAuth2
@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_laboral_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuario WHERE correo = %s", (form_data.username,))
    db_user = cur.fetchone()
    conn.close()
    
    if not db_user or not verify_password(form_data.password, db_user["contrasena"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
    access_token = create_access_token(data={"sub": db_user["correo"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/recover")
async def recover_password(correo: str):
    # Simulación de recuperación de contraseña (Módulo 5.1)
    conn = get_laboral_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuario WHERE correo = %s", (correo,))
    user = cur.fetchone()
    conn.close()
    
    if not user:
        return {"message": "Si el correo existe, se han enviado las instrucciones de recuperación."}
    
    # Aquí iría el envío de email real
    return {"message": "Si el correo existe, se han enviado las instrucciones de recuperación.", "demo_token": "123456"}

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id_usuario": current_user["id_usuario"],
        "nombre": current_user["nombre"],
        "apellido": current_user["apellido"],
        "correo": current_user["correo"],
        "rol": current_user["rol"]
    }
