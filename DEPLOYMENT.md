# Despliegue y variables de entorno (Vercel)

1. No incluir credenciales en el repositorio

- Copia `.env.example` a `.env.local` en tu máquina local y rellena `NEON_DATABASE_URL`.
- El archivo `.env.local` está ignorado por `.gitignore` (patrón `.env*.local`).

2. Configurar variables en Vercel

- En el panel de Vercel: Project → Settings → Environment Variables, añade `NEON_DATABASE_URL` (o `DATABASE_URL`) con el valor de Neon.
- Asegúrate de configurar valores para `Production`, `Preview` y `Development` según necesites.

3. Usando la CLI de Vercel

```bash
vercel env add NEON_DATABASE_URL production
vercel env add NEON_DATABASE_URL preview
vercel env add NEON_DATABASE_URL development
```

4. Nota sobre Neon y entornos serverless

- Este proyecto busca la variable `NEON_DATABASE_URL` primero y luego `DATABASE_URL`.
- Para entornos serverless, considera usar las recomendaciones de Neon (drivers serverless o Data API) si encuentras límites de conexiones.
