-- =====================================================
-- SONRISAS APP — Esquema completo v3
-- Ejecuta en: Supabase > SQL Editor > New query
-- Este archivo es IDEMPOTENTE: se puede ejecutar varias veces.
-- =====================================================

-- =====================================================
-- EXTENSIONES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- TABLA: profiles (PADRE)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre_completo TEXT,
  telefono TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user','admin','super_admin')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','family')),
  onboarding_completo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibilidad: añade columnas si la tabla ya existía
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
-- UNIQUE en username solo si aún no existe
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- =====================================================
-- TABLA: hijos
-- =====================================================
CREATE TABLE IF NOT EXISTS hijos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero TEXT DEFAULT 'nino',
  avatar_url TEXT,
  etapa_dental TEXT,
  presentacion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hijos ADD COLUMN IF NOT EXISTS etapa_dental TEXT;

-- =====================================================
-- TABLA: rutinas
-- =====================================================
CREATE TABLE IF NOT EXISTS rutinas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hijo_id UUID REFERENCES hijos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cepillado_manana BOOLEAN DEFAULT FALSE,
  cepillado_noche BOOLEAN DEFAULT FALSE,
  revision_encias BOOLEAN DEFAULT FALSE,
  completada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, hijo_id, fecha)
);

-- =====================================================
-- TABLA: logros
-- =====================================================
CREATE TABLE IF NOT EXISTS logros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT DEFAULT '🏆',
  fecha_ganado TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, tipo)
);

-- =====================================================
-- TABLA: citas
-- =====================================================
CREATE TABLE IF NOT EXISTS citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hijo_id UUID REFERENCES hijos(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TEXT NOT NULL,
  motivo TEXT DEFAULT 'Revisión',
  dentista TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: articulos  (CMS)
-- =====================================================
CREATE TABLE IF NOT EXISTS articulos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  etapa TEXT NOT NULL,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  resumen TEXT,
  contenido TEXT,
  imagen_url TEXT,
  video_url TEXT,
  destacado BOOLEAN DEFAULT FALSE,
  orden INTEGER DEFAULT 0,
  publicado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS publicado BOOLEAN DEFAULT TRUE;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- TABLA: saved_articulos (favoritos del usuario)
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_articulos (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  articulo_id UUID REFERENCES articulos(id) ON DELETE CASCADE,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, articulo_id)
);

-- =====================================================
-- TABLA: posts (comunidad Nido)
-- =====================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  oculto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS oculto BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: consentimientos (RGPD)
-- =====================================================
CREATE TABLE IF NOT EXISTS consentimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  acepta_datos BOOLEAN DEFAULT FALSE,
  acepta_notificaciones BOOLEAN DEFAULT FALSE,
  acepta_comunicaciones BOOLEAN DEFAULT FALSE,
  acepta_terminos BOOLEAN DEFAULT FALSE,
  fecha_aceptacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: suscripciones
-- =====================================================
CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free','pro','family')),
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','cancelada','pausada','vencida')),
  inicio_periodo TIMESTAMPTZ DEFAULT NOW(),
  fin_periodo TIMESTAMPTZ,
  proveedor TEXT,            -- stripe, manual, apple, google
  proveedor_id TEXT,
  precio_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: app_settings (editable desde admin: visual + textos)
-- =====================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Inserta defaults si no existen
INSERT INTO app_settings (key, value) VALUES
  ('brand_colors', '{"primary":"#3B9DC8","secondary":"#22C55E","background":"#EAF6FD"}'),
  ('home_consejos', '[
    "🦷 Cepilla los dientes durante 2 minutos, dos veces al día.",
    "💧 Beber agua después de comer ayuda a limpiar los dientes.",
    "🍎 Las frutas y verduras crujientes ayudan a limpiar los dientes.",
    "🧴 Cambia el cepillo cada 3 meses o cuando las cerdas se doblen.",
    "😴 El cepillado de noche es el más importante del día."
  ]'),
  ('landing_hero', '{"title":"La salud dental de tu hijo, desde el primer diente","cta":"Comenzar gratis"}')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- TRIGGER: crear perfil completo al registrarse
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, telefono, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
    NEW.raw_user_meta_data->>'username'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- TRIGGER: updated_at automático
-- =====================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_articulos_updated ON articulos;
CREATE TRIGGER trg_articulos_updated BEFORE UPDATE ON articulos
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE logros ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE consentimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER: ¿el usuario es admin?
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin','super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- POLÍTICAS
-- =====================================================
-- profiles: cada user se gestiona a sí mismo; admins pueden ver todo
DROP POLICY IF EXISTS "profile_select"       ON profiles;
DROP POLICY IF EXISTS "profile_update"       ON profiles;
DROP POLICY IF EXISTS "profile_insert"       ON profiles;
DROP POLICY IF EXISTS "profile_admin_select" ON profiles;
DROP POLICY IF EXISTS "profile_admin_update" ON profiles;
DROP POLICY IF EXISTS "profile_username_check" ON profiles;

CREATE POLICY "profile_select"       ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_update"       ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profile_insert"       ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_admin_select" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "profile_admin_update" ON profiles FOR UPDATE USING (is_admin());
-- Permitir comprobar si un username ya está en uso durante el registro (sólo lectura de id+username)
CREATE POLICY "profile_username_check" ON profiles FOR SELECT USING (true);

-- hijos: sólo el padre; admins también
DROP POLICY IF EXISTS "hijos_all" ON hijos;
DROP POLICY IF EXISTS "hijos_admin" ON hijos;
CREATE POLICY "hijos_all"   ON hijos FOR ALL USING (auth.uid() = parent_id);
CREATE POLICY "hijos_admin" ON hijos FOR SELECT USING (is_admin());

-- rutinas
DROP POLICY IF EXISTS "rutinas_all" ON rutinas;
CREATE POLICY "rutinas_all" ON rutinas FOR ALL USING (auth.uid() = parent_id);

-- logros
DROP POLICY IF EXISTS "logros_all" ON logros;
CREATE POLICY "logros_all" ON logros FOR ALL USING (auth.uid() = parent_id);

-- citas
DROP POLICY IF EXISTS "citas_all" ON citas;
CREATE POLICY "citas_all" ON citas FOR ALL USING (auth.uid() = parent_id);

-- articulos: lectura pública; admins escriben
DROP POLICY IF EXISTS "articulos_read"  ON articulos;
DROP POLICY IF EXISTS "articulos_write" ON articulos;
CREATE POLICY "articulos_read"  ON articulos FOR SELECT USING (publicado OR is_admin());
CREATE POLICY "articulos_write" ON articulos FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- saved_articulos
DROP POLICY IF EXISTS "saved_all" ON saved_articulos;
CREATE POLICY "saved_all" ON saved_articulos FOR ALL USING (auth.uid() = user_id);

-- posts
DROP POLICY IF EXISTS "posts_read"   ON posts;
DROP POLICY IF EXISTS "posts_insert" ON posts;
DROP POLICY IF EXISTS "posts_update" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;
DROP POLICY IF EXISTS "posts_admin"  ON posts;
CREATE POLICY "posts_read"   ON posts FOR SELECT USING ((NOT oculto) AND auth.role() = 'authenticated');
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "posts_admin"  ON posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- likes
DROP POLICY IF EXISTS "likes_all"  ON post_likes;
DROP POLICY IF EXISTS "likes_read" ON post_likes;
CREATE POLICY "likes_all"  ON post_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "likes_read" ON post_likes FOR SELECT USING (auth.role() = 'authenticated');

-- comentarios
DROP POLICY IF EXISTS "comentarios_read"   ON comentarios;
DROP POLICY IF EXISTS "comentarios_insert" ON comentarios;
DROP POLICY IF EXISTS "comentarios_delete" ON comentarios;
CREATE POLICY "comentarios_read"   ON comentarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "comentarios_insert" ON comentarios FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comentarios_delete" ON comentarios FOR DELETE USING (auth.uid() = author_id OR is_admin());

-- consentimientos
DROP POLICY IF EXISTS "consent_all" ON consentimientos;
CREATE POLICY "consent_all" ON consentimientos FOR ALL USING (auth.uid() = user_id);

-- suscripciones: el user ve la suya; admin todas
DROP POLICY IF EXISTS "subs_owner" ON suscripciones;
DROP POLICY IF EXISTS "subs_admin" ON suscripciones;
CREATE POLICY "subs_owner" ON suscripciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subs_admin" ON suscripciones FOR ALL   USING (is_admin()) WITH CHECK (is_admin());

-- app_settings: lectura pública; sólo admin escribe
DROP POLICY IF EXISTS "settings_read"  ON app_settings;
DROP POLICY IF EXISTS "settings_write" ON app_settings;
CREATE POLICY "settings_read"  ON app_settings FOR SELECT USING (true);
CREATE POLICY "settings_write" ON app_settings FOR ALL   USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- FUNCIONES
-- =====================================================
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ARTÍCULOS INICIALES
-- =====================================================
INSERT INTO articulos (etapa, categoria, titulo, resumen, destacado, orden) VALUES
('0-1', 'lavado', 'Antes del primer diente', 'Aunque todavía no hay dientes, los cuidados comienzan aquí. Así preparas la boca de tu bebé.', true, 1),
('0-1', 'lavado', 'Tu primer cepillo de dientes', 'Cómo elegir el cepillo perfecto para tu bebé.', false, 2),
('0-1', 'alimentacion', 'Alimentos amigos de los dientes', 'Qué alimentos ayudan al desarrollo dental de tu bebé.', false, 3),
('0-1', 'salud', 'Cómo calmar la molestia', 'Cuando salen los dientes puede ser doloroso. Estos consejos ayudan.', false, 4),
('0-1', 'lavado', 'Hábitos desde ya', 'Empieza los buenos hábitos desde el primer día.', false, 5),
('2-6', 'lavado', 'Técnica de cepillado para niños', 'Cómo enseñar a tu hijo a cepillarse correctamente.', true, 1),
('2-6', 'alimentacion', 'Snacks saludables para dientes fuertes', 'Alternativas sanas a los dulces que cuidan los dientes.', false, 2),
('2-6', 'dentista', 'Primera visita al dentista', 'Cómo preparar a tu hijo para su primera visita.', false, 3),
('2-6', 'salud', 'Caries: cómo prevenirlas', 'Todo lo que necesitas saber sobre la prevención de caries.', false, 4),
('6-12', 'lavado', 'Dientes permanentes: cuidados especiales', 'Los dientes definitivos merecen cuidados extra.', true, 1),
('6-12', 'ortodoncia', 'Cuándo consultar al ortodoncista', 'Señales de que tu hijo puede necesitar ortodoncia.', false, 2),
('6-12', 'salud', 'Selladores dentales: qué son', 'Una protección extra para los molares de tu hijo.', false, 3)
ON CONFLICT DO NOTHING;
