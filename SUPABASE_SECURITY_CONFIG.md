# Configuración de Seguridad en Supabase

Este documento describe la configuración recomendada de seguridad en tu proyecto de Supabase.

## Configuración de Autenticación

### 1. Políticas de Sesión

Ve a: **Authentication → Settings → Sessions**

Configuración recomendada:

```
✓ Enable Automatic Refresh Tokens
✓ Enable JWTs in cookies
✓ Enable MFA (Multi-Factor Authentication) - opcional para ahora

Session Duration: 86400 (24 horas)
Inactivity Timeout: 3600 (1 hora)
```

### 2. Configuración de Contraseñas

Ve a: **Authentication → Settings → Passwords**

Configuración recomendada:

```
✓ Enable Confirm Email
✓ Enable Confirm Email Reauthentication
✓ Enable Strong Passwords

Minimum Password Length: 8
```

### 3. Rate Limiting (en Supabase)

Ve a: **Authentication → Rate Limits**

Configuración recomendada:

```
Email Rate Limit: 5 requests per 15 minutes per IP
SMS Rate Limit: 1 request per minute per user
Token Rate Limit: 30 requests per minute per user
```

### 4. URLs Permitidas

Ve a: **Authentication → URL Configuration**

Añade tus URLs:

```
Site URL: http://localhost:3000 (desarrollo)
        https://tu-dominio.com (producción)

Redirect URLs:
- http://localhost:3000/auth/callback
- https://tu-dominio.com/auth/callback
- http://localhost:3000/login
- https://tu-dominio.com/login
```

### 5. Proveedores OAuth (Opcional)

Si quieres añadir login con Google/GitHub:

Ve a: **Authentication → Providers**

Habilita los proveedores deseados y configura los Client ID/Secret.

---

## Políticas de Seguridad en Base de Datos (RLS)

### Workspaces

```sql
-- Habilitar RLS
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver workspaces donde son miembros
CREATE POLICY "Users can view their workspaces" ON "Workspace"
  FOR SELECT USING (
    auth.uid()::text = ownerId OR 
    EXISTS (
      SELECT 1 FROM "WorkspaceMember" 
      WHERE "WorkspaceMember"."workspaceId" = "Workspace".id 
      AND "WorkspaceMember"."userId" = auth.uid()::text
    )
  );

-- Política: Solo owners pueden modificar
CREATE POLICY "Only owners can update workspaces" ON "Workspace"
  FOR UPDATE USING (
    auth.uid()::text = ownerId
  );

-- Política: Solo owners pueden eliminar
CREATE POLICY "Only owners can delete workspaces" ON "Workspace"
  FOR DELETE USING (
    auth.uid()::text = ownerId
  );

-- Política: Cualquiera puede crear (la lógica de autorización está en la app)
CREATE POLICY "Authenticated users can create workspaces" ON "Workspace"
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );
```

### Boards

```sql
-- Habilitar RLS
ALTER TABLE "Board" ENABLE ROW LEVEL SECURITY;

-- Política: Ver boards de workspaces accesibles
CREATE POLICY "Users can view boards in their workspaces" ON "Board"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Workspace" 
      WHERE "Workspace".id = "Board"."workspaceId"
      AND (
        "Workspace"."ownerId" = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM "WorkspaceMember"
          WHERE "WorkspaceMember"."workspaceId" = "Workspace".id
          AND "WorkspaceMember"."userId" = auth.uid()::text
        )
      )
    )
  );
```

### Tasks

```sql
-- Habilitar RLS
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- Política: Ver tasks de boards accesibles
CREATE POLICY "Users can view tasks in their boards" ON "Task"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Column" 
      JOIN "Board" ON "Board".id = "Column"."boardId"
      JOIN "Workspace" ON "Workspace".id = "Board"."workspaceId"
      WHERE "Column".id = "Task"."columnId"
      AND (
        "Workspace"."ownerId" = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM "WorkspaceMember"
          WHERE "WorkspaceMember"."workspaceId" = "Workspace".id
          AND "WorkspaceMember"."userId" = auth.uid()::text
        )
      )
    )
  );
```

---

## Funciones de Seguridad

### Función para verificar membresía

```sql
-- Función helper para verificar si un usuario es miembro de un workspace
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id text, user_id text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "WorkspaceMember"
    WHERE "workspaceId" = workspace_id
    AND "userId" = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Función para verificar si es owner

```sql
CREATE OR REPLACE FUNCTION is_workspace_owner(workspace_id text, user_id text)
RETURNS boolean AS $$
DECLARE
  workspace_owner_id text;
BEGIN
  SELECT "ownerId" INTO workspace_owner_id
  FROM "Workspace"
  WHERE id = workspace_id;
  
  RETURN workspace_owner_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Configuración de API Keys

### Rotación de Claves

**IMPORTANTE:** Rotar claves cada 90 días o si hay sospecha de compromiso.

Para rotar:
1. Ve a **Project Settings → API**
2. Haz clic en **Reveal** para ver las claves
3. Copia las claves y actualiza `.env.local`
4. Haz clic en **Regenerate** para generar nuevas
5. Actualiza `.env.local` con las nuevas claves

### Service Role Key

**NUNCA** expongas esta clave en:
- Código del cliente (browser)
- Repositorios públicos
- Logs
- Archivos de configuración versionados

Solo úsala en:
- Server Actions
- API Routes
- Scripts de backend

---

## Webhooks de Seguridad (Opcional)

Configura webhooks para recibir notificaciones de eventos de seguridad:

Ve a: **Database → Webhooks**

Eventos recomendados:
- `auth.users` → after insert (nuevo registro)
- `auth.users` → after update (cambios en usuario)
- `Workspace` → after update (cambios en workspaces)

---

## Logging y Monitoreo

Ve a: **Logs**

Revisa regularmente:
- Auth logs (intentos de login fallidos)
- Database logs (consultas lentas o errores)
- Realtime logs (conexiones WebSocket)

Configura alertas para:
- Múltiples intentos de login fallidos
- Errores de autenticación
- Consultas que excedan tiempo límite

---

## Checklist de Seguridad

### Antes de Producción

- [ ] Rotar todas las claves de API
- [ ] Habilitar RLS en todas las tablas
- [ ] Configurar políticas de CORS apropiadas
- [ ] Habilitar rate limiting
- [ ] Configurar confirmación de email
- [ ] Revisar URLs de redirección permitidas
- [ ] Configurar alertas de seguridad
- [ ] Habilitar backups automáticos

### Mantenimiento Regular

- [ ] Revisar logs de seguridad semanalmente
- [ ] Rotar claves cada 90 días
- [ ] Revisar usuarios inactivos
- [ ] Actualizar dependencias
- [ ] Auditar permisos de usuarios

---

## Recursos

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth Deep Dive](https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security)
