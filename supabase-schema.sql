-- =====================================================
-- SONRISAS APP — Esquema de base de datos Supabase
-- Ejecuta este SQL en: Supabase > SQL Editor > New query
-- =====================================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_emoji TEXT DEFAULT '👩',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Tabla de hijos
CREATE TABLE IF NOT EXISTS hijos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero TEXT DEFAULT 'niño',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de citas dentales
CREATE TABLE IF NOT EXISTS citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hijo_id UUID REFERENCES hijos(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TEXT NOT NULL,
  motivo TEXT DEFAULT 'Revisión',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de posts del Nido (comunidad)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de likes en posts
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de rutinas diarias
CREATE TABLE IF NOT EXISTS rutinas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hijo_id UUID REFERENCES hijos(id) ON DELETE SET NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cepillado_manana BOOLEAN DEFAULT FALSE,
  cepillado_noche BOOLEAN DEFAULT FALSE,
  sin_dulces BOOLEAN DEFAULT FALSE,
  revision_encias BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, fecha)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Seguridad por usuario
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuario ve y edita solo su perfil
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Hijos: solo el padre puede ver/editar sus hijos
CREATE POLICY "Parents can manage own children" ON hijos FOR ALL USING (auth.uid() = parent_id);

-- Citas: solo el padre puede ver/editar sus citas
CREATE POLICY "Parents can manage own appointments" ON citas FOR ALL USING (auth.uid() = parent_id);

-- Posts: todos los usuarios autenticados pueden leer, cada uno gestiona los suyos
CREATE POLICY "Authenticated users can read posts" ON posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authors can manage own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Likes: usuarios autenticados pueden dar/quitar likes
CREATE POLICY "Users can manage own likes" ON post_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read all likes" ON post_likes FOR SELECT USING (auth.role() = 'authenticated');

-- Comentarios: autenticados pueden leer, cada uno gestiona los suyos
CREATE POLICY "Authenticated can read comments" ON comentarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authors can manage own comments" ON comentarios FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON comentarios FOR DELETE USING (auth.uid() = author_id);

-- Rutinas: solo el padre puede ver/editar sus rutinas
CREATE POLICY "Parents can manage own routines" ON rutinas FOR ALL USING (auth.uid() = parent_id);

-- =====================================================
-- Función para incrementar likes
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
