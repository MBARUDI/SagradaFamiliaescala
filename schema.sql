-- Criação da tabela de Servidores (Coroinhas e Acólitos)
CREATE TABLE public.servers (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL
);

-- Criação da tabela de Escala (Presença)
CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES public.servers(id) ON DELETE CASCADE,
    mass_id TEXT NOT NULL, -- Pode ser ID da missa fixa ou ID da missa especial (ex: 'special-1')
    status TEXT DEFAULT 'pretended',
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Criação da tabela de Missas Especiais
CREATE TABLE public.special_masses (
    id SERIAL PRIMARY KEY,
    description TEXT,
    mass_date DATE NOT NULL,
    mass_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserindo os dados iniciais dos coroinhas e acólitos
INSERT INTO public.servers (id, nome, cargo) VALUES
(1, 'Arthur', 'Acólito'),
(2, 'Benjamin', 'Coroinha'),
(3, 'Caio', 'Coroinha'),
(4, 'Eduardo', 'Acólito'),
(5, 'Enrique', 'Acólito'),
(6, 'Felipe', 'Acólito'),
(7, 'Filipe', 'Acólito'),
(8, 'Guga', 'Coroinha'),
(9, 'Guilherme', 'Acólito'),
(10, 'Gusta', 'Acólito'),
(11, 'Henrique Kolbe', 'Coroinha'),
(12, 'João Vitor', 'Coroinha'),
(13, 'Lucas Davi', 'Coroinha'),
(14, 'Lucas S', 'Coroinha'),
(15, 'Luiggi', 'Acólito'),
(16, 'Martin', 'Coroinha'),
(17, 'Michel', 'Acólito'),
(18, 'Pedro Deveza', 'Acólito'),
(19, 'Pedro L', 'Acólito'),
(20, 'Rafael Kolbe', 'Coroinha'),
(21, 'Rafael Ross', 'Acólito');

-- Reinicia a sequência do ID para os próximos inseridos automaticamente não darem erro
ALTER SEQUENCE public.servers_id_seq RESTART WITH 22;

-- Habilitar Políticas de Segurança de Nível de Linha (RLS)
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_masses ENABLE ROW LEVEL SECURITY;

-- Políticas para Servers
CREATE POLICY "Permitir leitura pública em servers" ON public.servers FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública em servers" ON public.servers FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública em servers" ON public.servers FOR UPDATE USING (true);

-- Políticas para Attendance
CREATE POLICY "Permitir leitura pública em attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública em attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública em attendance" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção pública em attendance" ON public.attendance FOR DELETE USING (true);

-- Políticas para Special Masses
-- Nota: 'FOR ALL' cobre SELECT, INSERT, UPDATE e DELETE. 'WITH CHECK (true)' garante que inserções sejam permitidas.
DROP POLICY IF EXISTS "Permitir tudo em special_masses" ON public.special_masses;
CREATE POLICY "Permitir tudo em special_masses" ON public.special_masses FOR ALL USING (true) WITH CHECK (true);

/* 
   IMPORTANTE: 
   Se você receber erro "404 Not Found" ou "relation special_masses does not exist", 
   significa que você precisa copiar TODO este arquivo e colar no SQL Editor do Supabase e clicar em RUN.
*/
