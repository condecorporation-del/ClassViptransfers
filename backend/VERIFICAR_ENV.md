# 🔍 Verificar Configuración de .env

## Formato Correcto

Tu archivo `.env` debe tener esta línea (sin placeholders):

```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA_REAL@db.TU_PROJECT_REF.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

## Ejemplo Real

```env
DATABASE_URL="postgresql://postgres:MiPassword123@db.abcdefghijk.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

## Pasos para Configurar

1. **Abre el archivo `.env`** en el editor
2. **Encuentra la línea:**
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   ```

3. **Reemplaza:**
   - `[YOUR-PASSWORD]` → Tu contraseña real de Supabase
   - `[YOUR-PROJECT-REF]` → Tu referencia de proyecto (ej: `abcdefghijk`)

4. **Guarda el archivo**

## Verificar que Funciona

Después de configurar, ejecuta:

```bash
npm run db:test
```

Deberías ver:
```
✅ Connected to database successfully!
```

## Si Tienes Problemas

- Asegúrate de que no haya espacios extra
- Verifica que la contraseña no tenga caracteres especiales que necesiten escape
- El project reference es la parte entre `db.` y `.supabase.co`

