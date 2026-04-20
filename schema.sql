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
    mass_id TEXT NOT NULL,
    status TEXT DEFAULT 'pretended',
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserindo os dados iniciais dos coroinhas e acólitos
INSERT INTO public.servers (id, nome, cargo) VALUES
(1, 'João Silva', 'Coroinha'),
(2, 'Maria Oliveira', 'Acólito'),
(3, 'Pedro Santos', 'Coroinha'),
(4, 'Ana Costa', 'Acólito'),
(5, 'Lucas Lima', 'Coroinha');

-- Reinicia a sequência do ID para os próximos inseridos automaticamente não darem erro
ALTER SEQUENCE public.servers_id_seq RESTART WITH 6;

-- Habilitar Políticas de Segurança de Nível de Linha (RLS) - Permitir tudo para simplificar o frontend
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública em servers" ON public.servers FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública em servers" ON public.servers FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública em servers" ON public.servers FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura pública em attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública em attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública em attendance" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção pública em attendance" ON public.attendance FOR DELETE USING (true);
