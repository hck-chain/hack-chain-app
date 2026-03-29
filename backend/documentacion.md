# HackChain
## Resumen.
HackChain es un ecosistema educativo-laboral que vincula Talento, Educadores y Reclutadores con el fin de promover el aprendizaje constante y la transparencia en los procesos de reclutamiento.
## URL base
https://www.hackchain.app
## Stack tecnologico.
* Lenguaje de programación: Java Script
* Entorno de ejecución: node.js
* Framework: Express
* ORM: Sequelize
* Sistema de gestión de base de datos: PostgreSQL
* Base de datos: Neon DB
* Plataforma donde está desplegado el backend: Render
## Autenticacion.
Para acceder a las rutas protegidas de la API, es obligatorio incluir un JSON Web Token (JWT). El sistema utiliza la wallet contenida en el token para identificar automáticamente tu rol (Issuer, Student o Recruiter) y tus permisos.
### Headers de la Petición.
#### Header: Authorization.
* Value: Bearer <TU_TOKEN_JWT>
* Descripción: Obligatorio para rutas protegidas. Es indispensable que el token incluya el prefijo Bearer seguido de un espacio. Si se envía el token solo, el middleware devolverá un error.
#### Header: Content-Type.
* Value: application/json
* Descripción: Necesario en todas las peticiones POST o PUT. Indica al servidor que los datos enviados en el cuerpo tienen formato JSON.
### Especificaciones del Token.
