# GUÍA DE DESPLIEGUE (DEPLOYMENT GUIDE)

El sistema está listo para producción. Aquí tienes los pasos para subirlo a la nube (Vercel) y conectarlo con Twilio una vez desbloqueen la cuenta.

## 1. Despliegue en Vercel

Vercel es la plataforma recomendada para Next.js. El plan gratuito es suficiente para empezar.

### Pasos

1. Crea una cuenta en [Vercel.com](https://vercel.com).
2. Instala Vercel CLI si quieres desplegar desde terminal:

    ```bash
    npm i -g vercel
    ```

    O conecta tu repositorio de GitHub directamente en el dashboard de Vercel.

3. **Configurar Variables de Entorno (Environment Variables)**:
    En Vercel (Project Settings > Environment Variables), añade las siguientes claves copiando los valores de tu `.env.local` (o creando nuevos):

    | Variable | Valor | Descripción |
    | :--- | :--- | :--- |
    | `NEXT_PUBLIC_SUPABASE_URL` | `https://...` | URL de tu proyecto Supabase |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Clave anónima pública |
    | `SUPABASE_SERVICE_ROLE_KEY` | `ey...` | **CRÍTICO**: Clave secreta (nunca exponer al frontend) |
    | `NEXT_PUBLIC_APP_URL` | `https://tu-proyecto.vercel.app` | URL final de Vercel (actualízala después del deploy) |
    | `TWILIO_ACCOUNT_SID` | `AC...` | Tu ID de cuenta Twilio |
    | `TWILIO_AUTH_TOKEN` | `8f...` | Tu token secreto de Twilio |
    | `SETUP_SECRET` | `mi-secreto-seguro` | Clave para proteger rutas de administración (`api/setup-admin`) |

4. **Deploy**:
    Si usas GitHub, haz `git push`. Vercel desplegará automáticamente.
    Si usas CLI, ejecuta `vercel --prod` en la terminal.

## 2. Configuración de Twilio (Cuando esté desbloqueado)

Una vez Twilio habilite tu cuenta novamente:

1. Ve a **Twilio Console > Messaging > Senders > WhatsApp Senders**.
2. Selecciona tu número (ej. `+1305...`).
3. En la sección **Webhook url for incoming messages**, pega la URL de tu despliegue en Vercel:
    `https://tu-proyecto.vercel.app/api/webhooks/twilio`
4. Asegúrate de que el método sea `POST`.
5. Guarda los cambios.

## 3. Verificación Final

1. Envía un mensaje de WhatsApp a tu número.
2. Deberías ver el lead aparecer en `https://tu-proyecto.vercel.app/dashboard/leads`.
3. Si usas Meta Ads, verifica que al marcar "Qualified", el evento llegue al Administrador de Eventos de Meta.

## 4. Mantenimiento

- **Logs**: Puedes ver los errores en tiempo real en la pestaña **Logs** de Vercel.
- **Base de Datos**: Supabase gestiona la DB. No necesitas tocar nada allí salvo para backups.

¡Listo para escalar! 🚀
