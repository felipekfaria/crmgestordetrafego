// src/components/PublicLeadForm.tsx

import React, { useState } from 'react';

const PublicLeadForm = () => {
  const [formData, setFormData] = useState({
    lead_name: '',
    email: '',
    telefone: '',
  });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para lidar com a mudança nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus('Enviando...');

    // ====================================================================
    //      IMPORTANTE: SUBSTITUA OS VALORES DESTAS DUAS LINHASs
    // ====================================================================
const FUNCTION_URL = 'https://jwptodwqseqqoccrmbob.supabase.co/functions/v1/add-public-lead';
const SECRET_TOKEN = import.meta.env.VITE_SUPABASE_LEAD_FORM_TOKEN; 
    // ====================================================================

    try {
      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SECRET_TOKEN}`, // Envia o token para validação
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Se a resposta da função for um erro, exibe a mensagem de erro
        throw new Error(result.error || 'Ocorreu um erro ao enviar seu contato.');
      }

      // Se tudo deu certo:
      setStatus('Obrigado! Entraremos em contato em breve.');
      setFormData({ lead_name: '', email: '', telefone: '' }); // Limpa o formulário

    } catch (error: any) {
      // Se houver um erro de rede ou da função
      setStatus(`Erro: ${error.message}`);
    } finally {
      // Garante que o botão seja reativado após o envio
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '400px' }}>
      <h3 style={{ marginTop: 0 }}>Deixe seu contato</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="lead_name" style={{ display: 'block', marginBottom: '5px' }}>Nome Completo</label>
          <input
            id="lead_name"
            type="text"
            name="lead_name"
            placeholder="Seu nome"
            value={formData.lead_name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Seu melhor e-mail</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="email@exemplo.com"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="telefone" style={{ display: 'block', marginBottom: '5px' }}>WhatsApp (Opcional)</label>
          <input
            id="telefone"
            type="tel"
            name="telefone"
            placeholder="(XX) XXXXX-XXXX"
            value={formData.telefone}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Contato'}
        </button>
      </form>
      {status && <p style={{ marginTop: '15px', color: status.startsWith('Erro') ? 'red' : 'green' }}>{status}</p>}
    </div>
  );
};

export default PublicLeadForm;