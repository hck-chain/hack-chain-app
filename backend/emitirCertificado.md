# Flujo de emisión de un certificado tokenizado

---

## 1. Login

El educador conecta su wallet (MetaMask). El frontend toma la wallet address y la envía al backend. El backend verifica que esa wallet existe en la base de datos, devuelve un JWT y lo guarda en el navegador. Como su rol es `issuer`, lo redirige directo al Educator Dashboard.

---

## 2. Educator Dashboard arranca

Lo primero que hace el dashboard es preguntarle al backend **"¿quién soy?"** usando el JWT guardado. El backend lee la wallet del token, la busca en la tabla de issuers y responde con el nombre de la organización, la wallet y el email del educador. Al mismo tiempo carga la lista de todos los estudiantes registrados para mostrarlos en el formulario.

---

## 3. El educador llena el formulario

Escoge un estudiante del dropdown (que ya trae su nombre y wallet), pone el título del curso, la fecha, el nombre del emisor y sube un logo. Mientras llena los campos, una **preview animada** del certificado se actualiza en tiempo real a la derecha.

---

## 4. Click en "Create Certificate"

Aquí empieza la cadena de operaciones:

### 4.1 Imagen → IPFS
La imagen del certificado se sube a Pinata y regresa un **CID** — la dirección permanente del archivo en IPFS.

### 4.2 Metadata → IPFS
Con ese CID, el backend construye un JSON con los datos del certificado (nombre del estudiante, curso, wallet del educador como profesor, fecha e imagen) y también lo sube a Pinata. Este JSON es lo que el NFT va a referenciar para siempre.

```json

{
    "name": "Certificate for Emmanuel Pastor",
    "description": "HackChain Tokenized Certificate",
    "image": "ipfs://bafkreidqdnjdv2w2nsmhmzq43ezqaywuhtsvzj7ldwgrf3ly5khjhu5774",
    "attributes": [
        {
            "trait_type": "Student",
            "value": "Emmanuel Pastor"
        },
        {
            "trait_type": "Course",
            "value": "Introduction to Burpsuite"
        },
        {
            "trait_type": "Professor",
            "value": "Red Linuxera"
        },
        {
            "trait_type": "Date",
            "value": "2026-02-09"
        }
    ]
}

```

### 4.3 Validación
Antes de gastar gas en la blockchain, el backend verifica que tanto la wallet del estudiante como la del educador existen en la base de datos. Si algo falla aquí, el proceso se detiene.

### 4.4 Minteo en Polygon
El frontend llama al contrato inteligente con la wallet del estudiante y la URI del metadata. El educador **firma la transacción desde su wallet**, lo que prueba criptográficamente que él la autorizó. El contrato asigna el siguiente número disponible como `tokenId`, transfiere el NFT directo a la wallet del estudiante y graba el link al metadata de forma **permanente e inmutable**.

### 4.5 Registro en base de datos
Ya con el `txHash` y el `tokenId` confirmados por la blockchain, el backend guarda el certificado en la base de datos como espejo del estado on-chain.

### 4.6 Contador
Se incrementa en 1 el contador de certificados emitidos por ese educador, que se muestra en su perfil del dashboard.

---

## 5. El estudiante abre su dashboard

El estudiante conecta su wallet. El backend la busca en la tabla de students, confirma que existe, devuelve un JWT y lo redirige al Talent Dashboard. Con ese token el dashboard pregunta **"¿quién soy?"** y obtiene el nombre y wallet del estudiante.

---

## 6. Sus certificados aparecen

Con la wallet del estudiante, el backend consulta la API de OpenSea, trae todos los NFTs que tiene en la colección de HackChain y los ordena **del más reciente al más antiguo**.

---

## 7. El estudiante ve y comparte su certificado

Cada certificado aparece como una card con su imagen. Un botón **"View on OpenSea"** abre directamente la página del NFT, donde el estudiante puede ver los metadatos completos, la historia de transacciones y compartirlo como prueba verificable de su logro.

---

## Resumen visual

```
[EDUCADOR]
    │
    ├─ 1. Conecta wallet → JWT → Educator Dashboard
    ├─ 2. Dashboard carga perfil + lista de estudiantes
    ├─ 3. Llena formulario → preview en tiempo real
    └─ 4. Create Certificate
            ├─ Imagen   ──────────────────► Pinata IPFS   → CID imagen
            ├─ Metadata ──────────────────► Pinata IPFS   → tokenURI
            ├─ Validación ────────────────► Base de datos → ¿existen wallets?
            ├─ Minteo ────────────────────► Polygon       → tokenId + txHash
            ├─ Registro ──────────────────► Base de datos → certificado guardado
            └─ Contador ──────────────────► Base de datos → certificates_issued++

[ESTUDIANTE]
    │
    ├─ 5. Conecta wallet → JWT → Talent Dashboard
    ├─ 6. Dashboard consulta NFTs → OpenSea API → filtra colección HackChain
    └─ 7. Ve sus certificados → botón "View on OpenSea"
```
