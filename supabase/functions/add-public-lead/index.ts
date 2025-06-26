// /supabase/functions/add-public-lead/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define os cabeçalhos CORS para permitir que seu site público acesse a função
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Ou substitua '*' pelo domínio do seu site para mais segurança, ex: 'https://meusite.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // O navegador envia uma requisição "OPTIONS" antes da "POST" para verificar as permissões (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extrai o token de autorização do cabeçalho da requisição
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token de autorização ausente ou mal formatado.');
    }
    const token = authHeader.split(' ')[1];

    // 2. Extrai os dados do lead do corpo da requisição (o que foi enviado pelo formulário)
    const leadData = await req.json();
    const { lead_name, email, telefone, company, value } = leadData;

    // Validação básica dos dados recebidos
    if (!lead_name || !email) {
      throw new Error('Nome e email são campos obrigatórios.');
    }

    // 3. Cria um cliente Supabase com permissões de administrador (service_role)
    // Isso é seguro porque este código roda no servidor da Supabase, não no navegador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Usa o token para encontrar o user_id correspondente na sua tabela de tokens
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('public_form_tokens')
      .select('user_id')
      .eq('token', token)
      .single(); // .single() garante que esperamos apenas um resultado

    if (tokenError || !tokenData) {
      throw new Error('Token inválido ou não encontrado.');
    }

    const { user_id } = tokenData;

    // 5. Insere o novo lead na tabela 'leads' com o user_id correto
    const { error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        user_id: user_id,
        lead_name: lead_name,
        email: email,
        telefone: telefone || null,
        company: company || null,
        value: value || 0,
        status: 'new' // Status padrão para novos leads vindos do site
      });

    if (insertError) {
      // Se houver um erro ao inserir, lança o erro para ser capturado pelo bloco catch
      throw insertError;
    }

    // 6. Retorna uma resposta de sucesso para o formulário no seu site
    return new Response(JSON.stringify({ message: 'Lead adicionado com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Se qualquer um dos passos acima falhar, captura o erro aqui
    // e retorna uma resposta de erro para o formulário
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Status 400 indica um "Bad Request"
    });
  }
});