# Sonrisas — Puesta en marcha

Cambios que hice por ti y **3 cosas que tienes que hacer tú** para que todo funcione en producción.

## ✅ Lo que ya está arreglado en el código

- Registro / onboarding: ahora guarda correctamente `nombre_completo`, `telefono`, `username` en `profiles` y los datos del bebé en `hijos` (columna `etapa_dental` incluida).
- Panel de admin completo en `/admin` con:
  - `/admin` — resumen con métricas
  - `/admin/articulos` — CMS de guías (crear, editar, borrar, destacar, publicar)
  - `/admin/usuarios` — lista con cambio de rol y plan
  - `/admin/suscripciones` — alta manual de planes (beta)
  - `/admin/comunidad` — moderación de posts y comentarios
  - `/admin/visual` — colores de marca, hero de la landing, consejos del día
- Guard de rol: sólo `admin` o `super_admin` entran al panel.
- PWA: `manifest.json`, iconos 192 / 512 / maskable y `apple-touch-icon` añadidos. Cuando alguien "añade a pantalla de inicio" la app abre en modo standalone con tema `#3B9DC8`.
- `src/app/layout.tsx` migrado al export `viewport` de Next 14 (deja de salir el warning de consola).

## 1. Aplicar el schema de Supabase

Esto es **imprescindible** — hasta que no se corra el SQL, los registros siguen sin guardarse.

1. Abre tu proyecto en [Supabase](https://app.supabase.com) → **SQL Editor** → **New query**.
2. Pega el contenido completo de `supabase-schema.sql` (en la raíz del repo).
3. Pulsa **Run**. Es idempotente: se puede correr varias veces sin problema.

Esto crea / actualiza `profiles`, `hijos`, `articulos`, `posts`, `comentarios`, `suscripciones`, `app_settings`, los triggers (`handle_new_user`, `touch_updated_at`) y todas las políticas RLS (incluida la regla admin).

## 2. Promoverte a admin

Supabase no sabe todavía que tú eres la admin. Una vez ejecutado el schema, en el **SQL Editor** corre:

```sql
-- Cambia el email por el tuyo
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'melanie.po0806@gmail.com');
```

Después abre `https://sonrisas-app-bots.vercel.app/admin` — deberías ver el dashboard.

> Si te sale "No tienes permisos" cuando sí eres admin, cierra sesión y vuelve a entrar: la sesión cachea el perfil durante unos segundos.

## 3. Commit y deploy

El código ya está en tu carpeta local `sonrisas-app/`. Para que Vercel lo publique:

1. Abre **GitHub Desktop**.
2. Deberías ver todos los archivos nuevos en la pestaña "Changes" (admin/*, manifest.json, iconos, INSTRUCCIONES.md, etc.).
3. Escribe el mensaje de commit: `feat: admin dashboard, PWA y fix de registro`
4. **Commit to main** → **Push origin**.
5. Vercel detectará el push automáticamente y hará redeploy (~2 minutos).

## Cómo probar que todo funciona

- Registra un usuario nuevo desde `/signup` → comprueba en Supabase → Table Editor → `profiles` que aparece con `nombre_completo`, `telefono` y `username`.
- Completa onboarding → comprueba `hijos` que se ha creado una fila.
- Entra en `/admin` (con tu usuario promovido) → crea un artículo → `/guia` debería mostrarlo.
- En el móvil, Chrome → menú → **Añadir a pantalla de inicio** → la app abre sin la barra del navegador.

## Cambios visuales rápidos desde el admin

En `/admin/visual` puedes editar los colores de marca y el texto de la landing. Esos valores se guardan en la tabla `app_settings`. Para que el `layout.tsx` los use en caliente, en el siguiente iteración puedo enchufarlos como variables CSS — dime si quieres eso y lo añado.

---

Cualquier error o warning que salga en Vercel mándamelo y lo arreglo al vuelo.
