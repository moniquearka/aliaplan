<template>
  <div style="display:flex;flex-direction:column;gap:0">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;border-radius:50%;background:oklch(95% 0.005 260);display:flex;align-items:center;justify-content:center">
          <svg style="width:16px;height:16px;color:oklch(45% 0.02 250)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <h1 style="font-size:20px;font-weight:600;color:oklch(20% 0.05 250);margin:0">Resumo Jornada de Vida</h1>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button @click="isEditing ? handleCancel() : handleEdit()" :title="isEditing ? 'Cancelar edição' : 'Editar'" style="width:36px;height:36px;border-radius:8px;background:oklch(95% 0.005 260);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:oklch(45% 0.02 250)">
          <svg v-if="isEditing" style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg v-else style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 0. Dados do Proponente -->
    <SectionWithIcon title="Dados do Proponente">
      <template #icon>
        <svg style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </template>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px 24px">
        <div>
          <p class="field-label">CPF</p>
          <input v-if="isEditing" v-model="draftProponente.cpf" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.cpf || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Nome Completo</p>
          <input v-if="isEditing" v-model="draftProponente.nomeCompleto" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.nomeCompleto || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Nome Social</p>
          <input v-if="isEditing" v-model="draftProponente.nomeSocial" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.nomeSocial || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Data de Nascimento</p>
          <input v-if="isEditing" type="date" v-model="draftProponente.dataNascimento" class="inline-edit" />
          <p v-else class="field-value">{{ formatDate(proponente.dataNascimento) }}</p>
        </div>
        <div>
          <p class="field-label">Telefone</p>
          <input v-if="isEditing" v-model="draftProponente.telefone" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.telefone || '—' }}</p>
        </div>
        <div>
          <p class="field-label">E-mail</p>
          <input v-if="isEditing" v-model="draftProponente.email" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.email || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Renda Mensal</p>
          <input v-if="isEditing" v-model="draftProponente.rendaMensal" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.rendaMensal || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Ocupação</p>
          <select v-if="isEditing" v-model="draftProponente.ocupacao" class="inline-edit" style="cursor:pointer;background-color:white;appearance:auto">
            <option value="">— Selecione —</option>
            <option>Assistente</option>
            <option>Analista Júnior</option>
            <option>Analista Pleno</option>
            <option>Analista Sênior</option>
            <option>Especialista</option>
            <option>Líder</option>
            <option>Coordenador</option>
            <option>Supervisor</option>
            <option>Gerente</option>
            <option>Diretor</option>
            <option>C-Level</option>
          </select>
          <p v-else class="field-value">{{ proponente.ocupacao || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Empresa</p>
          <input v-if="isEditing" v-model="draftProponente.empresa" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.empresa || '—' }}</p>
        </div>
      </div>
    </SectionWithIcon>

    <!-- 1. Perfil de Personalidade -->
    <SectionWithIcon title="Perfil de Personalidade">
      <template #icon>
        <svg style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </template>
      <div v-if="isEditing" style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label class="field-label">Tipo de Perfil</label>
          <input v-model="draft.perfil.tipo" class="inline-edit" />
        </div>
        <div>
          <label class="field-label">Descrição</label>
          <textarea v-model="draft.perfil.descricao" rows="3" class="textarea-edit" />
        </div>
      </div>
      <div v-else style="display:flex;flex-direction:column;gap:12px">
        <div>
          <span class="field-label">Tipo de Perfil</span>
          <p style="font-size:14px;font-weight:600;letter-spacing:0.02em;color:oklch(20% 0.05 250)">{{ data.perfil.tipo }}</p>
        </div>
        <div>
          <span class="field-label">Descrição</span>
          <p style="font-size:14px;color:oklch(20% 0.05 250);line-height:1.625">{{ data.perfil.descricao }}</p>
        </div>
      </div>
    </SectionWithIcon>

    <!-- 2. Cenários de Risco Atual -->
    <SectionWithIcon title="Cenários de Risco Atual">
      <template #icon>
        <svg style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </template>
      <div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:8px;padding:12px 16px">
        <input v-if="isEditing" v-model="draft.cenario.titulo" class="inline-edit" style="margin-bottom:12px;font-weight:600" />
        <p v-else style="font-size:13px;font-weight:600;color:oklch(20% 0.05 250);margin-bottom:12px">{{ data.cenario.titulo }}</p>
        <ul style="display:flex;flex-direction:column;gap:6px;list-style:none;padding:0;margin:0">
          <li v-for="(item, i) in data.cenario.itens" :key="i" style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#1e40af">
            <span style="margin-top:6px;width:6px;height:6px;border-radius:50%;background:#1e40af;flex-shrink:0;display:inline-block" />
            <input v-if="isEditing" v-model="draft.cenario.itens[i]" class="inline-edit" />
            <span v-else>{{ item }}</span>
          </li>
        </ul>
      </div>
    </SectionWithIcon>

    <!-- 3. Vulnerabilidades Identificadas -->
    <SectionWithIcon title="Vulnerabilidades Identificadas">
      <template #icon>
        <svg style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      </template>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div v-for="(vuln, i) in data.vulnerabilidades" :key="i" style="border-radius:8px;padding:16px;border:1px solid oklch(90% 0.005 260);background:#f8fafc;display:flex;align-items:flex-start;gap:12px">
          <div style="margin-top:2px;width:32px;height:32px;border-radius:8px;background:#eff6ff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg style="width:16px;height:16px;color:#93c5fd" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div style="flex:1;min-width:0">
            <div v-if="isEditing" style="display:flex;flex-direction:column;gap:6px">
              <input v-model="draft.vulnerabilidades[i].titulo" class="inline-edit" style="font-weight:600" />
              <textarea v-model="draft.vulnerabilidades[i].descricao" rows="2" class="textarea-edit" />
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:12px;color:oklch(45% 0.02 250);white-space:nowrap">Solução Recomendada:</span>
                <input v-model="draft.vulnerabilidades[i].solucao" class="inline-edit" />
              </div>
            </div>
            <template v-else>
              <p style="font-size:13px;font-weight:600;color:oklch(20% 0.05 250);margin:0 0 2px">{{ vuln.titulo }}</p>
              <p style="font-size:12px;color:oklch(45% 0.02 250);margin:0 0 4px">{{ vuln.descricao }}</p>
              <p style="font-size:12px;color:#1e40af;font-weight:500;margin:0">Solução Recomendada: <strong>{{ vuln.solucao }}</strong></p>
            </template>
          </div>
        </div>
      </div>
    </SectionWithIcon>

    <!-- 4. Planejamento de Longo Prazo -->
    <SectionWithIcon title="Planejamento de Longo Prazo">
      <template #icon>
        <svg style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </template>
      <div style="display:flex;flex-direction:column">
        <div v-for="(item, i) in data.timeline" :key="i" style="display:flex;gap:16px;padding:16px 0" :style="i < data.timeline.length - 1 ? 'border-bottom:1px solid oklch(92% 0.003 260)' : ''">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:4px">
            <div style="width:10px;height:10px;border-radius:50%;background:#1e3a8a;box-shadow:0 0 0 3px #bfdbfe;flex-shrink:0" />
            <div style="width:2px;flex:1;background:oklch(90% 0.004 286);margin-top:4px" />
          </div>
          <div style="flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding-bottom:4px">
            <div style="display:flex;flex-direction:column;gap:2px">
              <p style="font-size:12px;font-weight:600;color:#1e40af;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 2px">{{ item.periodo }}</p>
              <div v-if="isEditing" style="display:flex;flex-direction:column;gap:4px">
                <input v-model="draft.timeline[i].titulo" class="inline-edit" style="font-weight:600" />
                <textarea v-model="draft.timeline[i].descricao" rows="2" class="textarea-edit" />
              </div>
              <template v-else>
                <p style="font-size:14px;font-weight:600;color:oklch(20% 0.05 250);margin:0 0 2px">{{ item.titulo }}</p>
                <p style="font-size:12px;color:oklch(45% 0.02 250);line-height:1.5;margin:0">{{ item.descricao }}</p>
              </template>
            </div>
            <div style="border-radius:8px;border:1px solid #bfdbfe;background:rgba(239,246,255,0.8);padding:12px;font-size:12px;color:#1e40af">
              <span style="display:inline-block;background:#dbeafe;color:#1e40af;font-weight:700;font-size:11px;padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">{{ item.riscoLabel }}</span>
              <ul style="display:flex;flex-direction:column;gap:3px;margin:4px 0 0;padding:0;list-style:none">
                <li v-for="(risco, j) in item.riscos" :key="j" style="display:flex;align-items:flex-start;gap:6px;font-size:12px;color:#1e40af;line-height:1.4">
                  <span style="margin-top:5px;width:4px;height:4px;border-radius:50%;background:#1e40af;flex-shrink:0;display:inline-block" />
                  <input v-if="isEditing" v-model="draft.timeline[i].riscos[j]" class="inline-edit" />
                  <span v-else>{{ risco }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div style="background:oklch(97% 0.002 260);border:1px solid oklch(90% 0.005 260);border-radius:8px;padding:12px 16px;margin-top:4px">
          <span style="font-size:12px;font-weight:600;color:oklch(20% 0.05 250);display:block;margin-bottom:4px">Visão de Longo Prazo:</span>
          <textarea v-if="isEditing" v-model="draft.visaoLongoPrazo" rows="2" class="textarea-edit" />
          <span v-else style="font-size:12px;color:oklch(45% 0.02 250);font-style:italic;line-height:1.5;display:block">
            {{ data.visaoLongoPrazo || 'Cada etapa exige preparação financeira específica. O acúmulo de capital deve ser constante para suportar os picos de despesa com educação e saúde familiar.' }}
          </span>
        </div>
      </div>
    </SectionWithIcon>

    <!-- 5. Soluções Propostas -->
    <SectionWithIcon title="Soluções Propostas">
      <template #icon>
        <svg style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      </template>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:16px">
        <!-- Proteção -->
        <div style="border:1px solid oklch(90% 0.005 260);border-radius:8px;padding:14px 16px;background:oklch(97% 0.002 260)">
          <div v-if="isEditing" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap">
              <span style="font-size:13px;color:oklch(30% 0.05 250);white-space:nowrap">Destinar</span>
              <input v-model="draft.solucoes.protecao.valor" class="inline-edit" style="width:110px" />
              <span style="font-size:13px;color:oklch(30% 0.05 250);white-space:nowrap">(</span>
              <input v-model="draft.solucoes.protecao.percentual" class="inline-edit" style="width:50px" />
              <span style="font-size:13px;color:oklch(30% 0.05 250);white-space:nowrap">% do saldo) garante:</span>
            </div>
          </div>
          <div v-else style="display:flex;align-items:center;gap:4px;margin-bottom:10px;flex-wrap:wrap">
            <span style="font-size:13px;color:oklch(30% 0.05 250)">Destinar</span>
            <strong style="font-size:12px">{{ data.solucoes.protecao.valor }}/mês</strong>
            <span style="font-size:13px;color:oklch(30% 0.05 250)">(<strong style="font-size:12px">{{ data.solucoes.protecao.percentual }}% do saldo</strong>) garante:</span>
          </div>
          <div v-for="(item, i) in data.solucoes.protecao.itens" :key="i" style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
            <CheckIcon />
            <input v-if="isEditing" v-model="draft.solucoes.protecao.itens[i]" class="inline-edit" />
            <span v-else style="font-size:13px;color:oklch(30% 0.05 250)">{{ item }}</span>
          </div>
        </div>
        <!-- Previdência -->
        <div style="border:1px solid oklch(90% 0.005 260);border-radius:8px;padding:14px 16px;background:oklch(97% 0.002 260)">
          <div v-if="isEditing" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap">
              <span style="font-size:13px;color:oklch(30% 0.05 250);white-space:nowrap">E destinando mais</span>
              <input v-model="draft.solucoes.previdencia.valor" class="inline-edit" style="width:110px" />
              <span style="font-size:13px;color:oklch(30% 0.05 250);white-space:nowrap">(</span>
              <input v-model="draft.solucoes.previdencia.percentual" class="inline-edit" style="width:50px" />
              <span style="font-size:13px;color:oklch(30% 0.05 250);white-space:nowrap">% do saldo) garante:</span>
            </div>
          </div>
          <div v-else style="display:flex;align-items:center;gap:4px;margin-bottom:10px;flex-wrap:wrap">
            <span style="font-size:13px;color:oklch(30% 0.05 250)">E destinando mais</span>
            <strong style="font-size:12px">{{ data.solucoes.previdencia.valor }}/mês</strong>
            <span style="font-size:13px;color:oklch(30% 0.05 250)">(<strong style="font-size:12px">{{ data.solucoes.previdencia.percentual }}% do saldo</strong>) garante:</span>
          </div>
          <div v-for="(item, i) in data.solucoes.previdencia.itens" :key="i" style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
            <CheckIcon />
            <input v-if="isEditing" v-model="draft.solucoes.previdencia.itens[i]" class="inline-edit" />
            <span v-else style="font-size:13px;color:oklch(30% 0.05 250)">{{ item }}</span>
          </div>
          <textarea v-if="isEditing" v-model="draft.solucoes.previdencia.citacao" rows="2" class="textarea-edit" />
          <p v-else style="font-size:12px;color:oklch(45% 0.02 250);font-style:italic;line-height:1.5;border-top:1px solid oklch(90% 0.005 260);padding-top:10px;margin:0">
            "{{ data.solucoes.previdencia.citacao }}"
          </p>
        </div>
      </div>
      <!-- Investimento Mensal -->
      <div style="border:1px solid oklch(90% 0.005 260);border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;background:#fff">
        <div>
          <p style="font-size:14px;font-weight:500;color:oklch(20% 0.05 250);margin:0">Investimento Mensal</p>
          <p style="font-size:12px;color:oklch(45% 0.02 250);margin:0">Apenas 30% do seu saldo mensal</p>
        </div>
        <span style="font-size:13px;font-weight:600;color:oklch(20% 0.05 250)">R$ {{ totalInvestimento }}</span>
      </div>
    </SectionWithIcon>

    <!-- 6. O Que Você Protege + O Que Você Garante -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:0">
      <div class="section-card" style="margin-bottom:0">
        <h3 style="font-size:15px;font-weight:600;color:oklch(20% 0.05 250);margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid oklch(90% 0.005 260)">O Que Você Protege</h3>
        <div>
          <div v-for="(item, i) in data.protege" :key="i" style="display:flex;justify-content:space-between;align-items:flex-start;padding:12px 0;gap:8px" :style="i < data.protege.length - 1 ? 'border-bottom:1px solid rgba(226,232,240,0.6)' : ''">
            <div>
              <div v-if="isEditing" style="display:flex;flex-direction:column;gap:4px">
                <input v-model="draft.protege[i].titulo" class="inline-edit" />
                <input v-model="draft.protege[i].subtitulo" class="inline-edit" />
              </div>
              <template v-else>
                <p style="font-size:13px;font-weight:500;color:oklch(20% 0.05 250);margin:0">{{ item.titulo }}</p>
                <p style="font-size:11px;color:oklch(45% 0.02 250);margin:0">{{ item.subtitulo }}</p>
              </template>
            </div>
            <span style="font-size:13px;font-weight:600;color:oklch(20% 0.05 250);white-space:nowrap">
              <input v-if="isEditing" v-model="draft.protege[i].valor" class="inline-edit" />
              <template v-else>{{ item.valor }}</template>
            </span>
          </div>
        </div>
      </div>
      <div class="section-card" style="margin-bottom:0">
        <h3 style="font-size:15px;font-weight:600;color:oklch(20% 0.05 250);margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid oklch(90% 0.005 260)">O Que Você Garante</h3>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
          <CheckIcon />
          <span style="font-size:13px;font-weight:600;color:#16a34a">Com Proteção</span>
        </div>
        <div>
          <div v-for="(item, i) in data.garante.comProtecao" :key="i" style="display:flex;align-items:center;gap:8px;padding:12px 0" :style="i < data.garante.comProtecao.length - 1 ? 'border-bottom:1px solid rgba(226,232,240,0.6)' : ''">
            <CheckIcon />
            <input v-if="isEditing" v-model="draft.garante.comProtecao[i]" class="inline-edit" />
            <span v-else style="font-size:13px;color:oklch(20% 0.05 250);flex:1">{{ item }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Botões de ação -->
    <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;padding-top:24px;padding-bottom:16px">
      <template v-if="isEditing">
        <button @click="handleCancel" style="padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;border:1px solid oklch(80% 0.005 260);background:#fff;color:oklch(30% 0.05 250);cursor:pointer">Cancelar</button>
        <button @click="handleSave" style="display:flex;align-items:center;gap:6px;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;border:none;background:oklch(20% 0.05 250);color:#fff;cursor:pointer">
          <svg style="width:14px;height:14px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Salvar
        </button>
      </template>
      <button @click="handleContinuar" :disabled="isEditing" :style="{ display:'flex', alignItems:'center', gap:'8px', background: isEditing ? 'oklch(80% 0.005 260)' : 'oklch(20% 0.05 250)', color: isEditing ? 'oklch(50% 0.01 260)' : '#fff', padding:'10px 24px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', border:'none', cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.6 : 1 }">
        Continuar
        <svg style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useJornadaStore } from '~/stores/jornada'
import type { ResumoData } from '~/stores/jornada'

const emit = defineEmits<{ next: []; 'editing-change': [editing: boolean] }>()

const store = useJornadaStore()

const isEditing = ref(false)
const draft = ref<ResumoData>(JSON.parse(JSON.stringify(store.resumoData)))
const draftProponente = ref({ ...store.detalhamentoData.proponente })

const data = computed(() => isEditing.value ? draft.value : store.resumoData)
const proponente = computed(() => isEditing.value ? draftProponente.value : store.detalhamentoData.proponente)

const totalInvestimento = computed(() => {
  const parseVal = (s: string) => {
    const clean = s.replace(/[R$\s]/g, '').replace(/\/mês/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(clean)
    return isNaN(n) ? 0 : n
  }
  const v1 = parseVal(data.value.solucoes.protecao.valor)
  const v2 = parseVal(data.value.solucoes.previdencia.valor)
  const total = v1 + v2
  return total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
})

const formatDate = (d: string) => {
  if (!d) return '—'
  return d.split('-').reverse().join('/')
}

const handleEdit = () => {
  draft.value = JSON.parse(JSON.stringify(store.resumoData))
  draftProponente.value = { ...store.detalhamentoData.proponente }
  isEditing.value = true
  emit('editing-change', true)
}

const handleCancel = () => {
  isEditing.value = false
  emit('editing-change', false)
}

const handleSave = () => {
  store.saveResumoData(draft.value)
  store.saveDetalhamentoData({ ...store.detalhamentoData, proponente: draftProponente.value })
  isEditing.value = false
  emit('editing-change', false)
}

const handleContinuar = () => {
  if (isEditing.value) return
  emit('next')
}
</script>

<!-- Sub-components inline -->
<script lang="ts">
// CheckIcon component
</script>

<style>
/* Inline sub-components */
</style>
