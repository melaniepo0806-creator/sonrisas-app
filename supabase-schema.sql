-- =====================================================
-- SONRISAS APP — Esquema completo v2
-- Ejecuta en: Supabase > SQL Editor > New query
-- =====================================================

-- TABLA: profiles (PADRE)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre_completo TEXT,
  telefono TEXT,
  avatar_url TEXT,
  onboarding_completo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: hijos (PEQUE)
CREATE TABLE IF NOT EXISTS hijos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero TEXT DEFAULT 'nino',
  avatar_url TEXT,
  presentacion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: rutinas
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

-- TABLA: logros
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

-- TABLA: citas
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

-- TABLA: articulos
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: post_likes
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- TABLA: comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: consentimientos (RGPD)
CREATE TABLE IF NOT EXISTS consentimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  acepta_datos BOOLEAN DEFAULT FALSE,
  acepta_notificaciones BOOLEAN DEFAULT FALSE,
  acepta_comunicaciones BOOLEAN DEFAULT FALSE,
  acepta_terminos BOOLEAN DEFAULT FALSE,
  fecha_aceptacion TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGER: crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre_completo', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE logros ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE consentimientos ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
DROP POLICY IF EXISTS "profile_select" ON profiles;
DROP POLICY IF EXISTS "profile_update" ON profiles;
DROP POLICY IF EXISTS "profile_insert" ON profiles;
CREATE POLICY "profile_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profile_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies: hijos
DROP POLICY IF EXISTS "hijos_all" ON hijos;
CREATE POLICY "hijos_all" ON hijos FOR ALL USING (auth.uid() = parent_id);

-- Policies: rutinas
DROP POLICY IF EXISTS "rutinas_all" ON rutinas;
CREATE POLICY "rutinas_all" ON rutinas FOR ALL USING (auth.uid() = parent_id);

-- Policies: logros
DROP POLICY IF EXISTS "logros_all" ON logros;
CREATE POLICY "logros_all" ON logros FOR ALL USING (auth.uid() = parent_id);

-- Policies: citas
DROP POLICY IF EXISTS "citas_all" ON citas;
CREATE POLICY "citas_all" ON citas FOR ALL USING (auth.uid() = parent_id);

-- Policies: articulos (público)
DROP POLICY IF EXISTS "articulos_read" ON articulos;
CREATE POLICY "articulos_read" ON articulos FOR SELECT USING (true);

-- Policies: posts
DROP POLICY IF EXISTS "posts_read" ON posts;
DROP POLICY IF EXISTS "posts_insert" ON posts;
DROP POLICY IF EXISTS "posts_update" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_read" ON posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Policies: likes
DROP POLICY IF EXISTS "likes_all" ON post_likes;
DROP POLICY IF EXISTS "likes_read" ON post_likes;
CREATE POLICY "likes_all" ON post_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "likes_read" ON post_likes FOR SELECT USING (auth.role() = 'authenticated');

-- Policies: comentarios
DROP POLICY IF EXISTS "comentarios_read" ON comentarios;
DROP POLICY IF EXISTS "comentarios_insert" ON comentarios;
DROP POLICY IF EXISTS "comentarios_delete" ON comentarios;
CREATE POLICY "comentarios_read" ON comentarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "comentarios_insert" ON comentarios FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comentarios_delete" ON comentarios FOR DELETE USING (auth.uid() = author_id);

-- Policies: consentimientos
DROP POLICY IF EXISTS "consent_all" ON consentimientos;
CREATE POLICY "consent_all" ON consentimientos FOR ALL USING (auth.uid() = user_id);

-- FUNCIONES
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

-- ARTÍCULOS INICIALES
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
