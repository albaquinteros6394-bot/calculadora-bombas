Proyecto: Sistema de Bombeo en Cascada

Cómo ejecutar (local):
1. npm install
2. npm run dev
3. Abrir http://localhost:3000

Despliegue en Vercel:
1. Crear repo en GitHub con estos archivos (o subir ZIP).
2. En vercel.com -> Import Project -> subir repo.
3. Si Vercel usa turbopack y hay problemas, define variable de entorno: NEXT_SKIP_TURBOPACK=1

Notas:
- Cálculos de pérdida: Darcy–Weisbach (Swamee–Jain)
- Potencia hidráulica: P = rho*g*Q*H
