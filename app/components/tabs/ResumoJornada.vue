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
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px 24px;align-items:start">
        <div>
          <p class="field-label">CPF <span style="color:#dc2626">*</span></p>
          <input v-if="isEditing" v-model="draftProponente.cpf" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.cpf || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Nome Completo <span style="color:#dc2626">*</span></p>
          <input v-if="isEditing" v-model="draftProponente.nomeCompleto" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.nomeCompleto || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Nome Social</p>
          <input v-if="isEditing" v-model="draftProponente.nomeSocial" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.nomeSocial || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Data de Nascimento <span style="color:#dc2626">*</span></p>
          <input v-if="isEditing" type="date" v-model="draftProponente.dataNascimento" class="inline-edit" />
          <p v-else class="field-value">{{ formatDate(proponente.dataNascimento) }}</p>
        </div>
        <div>
          <p class="field-label">Telefone <span style="color:#dc2626">*</span></p>
          <input v-if="isEditing" v-model="draftProponente.telefone" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.telefone || '—' }}</p>
        </div>
        <div>
          <p class="field-label">E-mail <span style="color:#dc2626">*</span></p>
          <input v-if="isEditing" v-model="draftProponente.email" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.email || '—' }}</p>
        </div>
        <div>
          <p class="field-label">Renda Mensal <span style="color:#dc2626">*</span></p>
          <input v-if="isEditing" v-model="draftProponente.rendaMensal" class="inline-edit" />
          <p v-else class="field-value">{{ proponente.rendaMensal || '—' }}</p>
        </div>
        <div style="position:relative">
          <p class="field-label">Ocupação</p>
          <template v-if="isEditing">
            <input
              v-model="ocupacaoSearch"
              class="inline-edit"
              placeholder="Digite para buscar..."
              @focus="showOcupacaoDropdown = true"
              @blur="onOcupacaoBlur"
              autocomplete="off"
            />
            <div v-if="showOcupacaoDropdown && filteredProfissoes.length > 0" style="position:absolute;top:100%;left:0;right:0;max-height:200px;overflow-y:auto;background:#fff;border:1px solid oklch(80% 0.005 260);border-radius:6px;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
              <div
                v-for="prof in filteredProfissoes.slice(0, 50)"
                :key="prof"
                @mousedown.prevent="selectOcupacao(prof)"
                style="padding:8px 12px;font-size:13px;cursor:pointer;color:oklch(20% 0.05 250)"
                :style="prof === draftProponente.ocupacao ? 'background:oklch(95% 0.005 260);font-weight:600' : ''"
                @mouseover="($event.target as HTMLElement).style.background='oklch(97% 0.003 260)'"
                @mouseout="($event.target as HTMLElement).style.background=prof === draftProponente.ocupacao ? 'oklch(95% 0.005 260)' : ''"
              >{{ prof }}</div>
            </div>
          </template>
          <p v-else class="field-value">{{ proponente.ocupacao || '—' }}</p>
        </div>
        <!-- Especificação da Ocupação (quando OUTROS) - ocupa a 3ª coluna no lugar de Empresa -->
        <template v-if="(isEditing ? draftProponente.ocupacao : proponente.ocupacao) === 'OUTROS (ESPECIFICAR)'">
          <div>
            <p class="field-label">Especificação da Ocupação <span style="color:#dc2626">*</span></p>
            <input v-if="isEditing" v-model="draftProponente.especificacaoOcupacao" class="inline-edit" placeholder="Descreva a ocupação..." />
            <p v-else class="field-value">{{ proponente.especificacaoOcupacao || '—' }}</p>
          </div>
          <!-- Empresa aparece na linha seguinte quando OUTROS está selecionado -->
          <div style="grid-column: 1">
            <p class="field-label">Empresa</p>
            <input v-if="isEditing" v-model="draftProponente.empresa" class="inline-edit" />
            <p v-else class="field-value">{{ proponente.empresa || '—' }}</p>
          </div>
        </template>
        <!-- Quando não é OUTROS, Empresa fica na 3ª coluna da mesma linha -->
        <template v-else>
          <div>
            <p class="field-label">Empresa</p>
            <input v-if="isEditing" v-model="draftProponente.empresa" class="inline-edit" />
            <p v-else class="field-value">{{ proponente.empresa || '—' }}</p>
          </div>
        </template>
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
        <p style="font-size:13px;font-weight:600;color:oklch(20% 0.05 250);margin-bottom:12px">{{ data.cenario.titulo }}</p>
        <ul style="display:flex;flex-direction:column;gap:6px;list-style:none;padding:0;margin:0">
          <li v-for="(item, i) in data.cenario.itens" :key="i" style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#1e40af">
            <span style="margin-top:6px;width:6px;height:6px;border-radius:50%;background:#1e40af;flex-shrink:0;display:inline-block" />
            <span>{{ item }}</span>
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
            <div style="display:flex;flex-direction:column;gap:6px">
              <p style="font-size:13px;font-weight:600;color:oklch(20% 0.05 250);margin:0 0 2px">{{ vuln.titulo }}</p>
              <p style="font-size:12px;color:oklch(45% 0.02 250);margin:0 0 4px">{{ vuln.descricao }}</p>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-size:12px;color:oklch(45% 0.02 250);white-space:nowrap">Solução Recomendada:</span>
                <select v-if="isEditing" v-model="draft.vulnerabilidades[i].solucao" style="font-size:12px;color:#1e40af;font-weight:500;border:1px solid oklch(80% 0.005 260);border-radius:4px;padding:3px 6px;background:#fff;max-width:280px;cursor:pointer">
                  <option value="">Selecione...</option>
                  <option>Seguro de Vida Vitalício</option>
                  <option>Seguro de Invalidez + DIT</option>
                  <option>Cobertura para Doenças Graves</option>
                  <option>Seguro para Custeio de Inventário</option>
                  <option>Aporte em Previdência Privada</option>
                </select>
                <span v-else style="font-size:12px;color:#1e40af;font-weight:500"><strong>{{ vuln.solucao }}</strong></span>
              </div>
            </div>
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
        <template v-for="(item, i) in data.timeline" :key="i">
          <!-- Para os dois últimos itens (LONGO PRAZO), agrupa em uma única linha com título unificado -->
          <template v-if="normalizePeriodo(item.periodo) === 'LONGO PRAZO' && i > 0 && normalizePeriodo(data.timeline[i-1].periodo) === 'LONGO PRAZO'">
            <!-- segundo item do Longo Prazo: já foi renderizado junto com o primeiro, pular -->
          </template>
          <template v-else-if="normalizePeriodo(item.periodo) === 'LONGO PRAZO' && i < data.timeline.length - 1 && normalizePeriodo(data.timeline[i+1].periodo) === 'LONGO PRAZO'">
            <!-- Primeiro item do Longo Prazo: renderiza os dois juntos -->
            <div style="display:flex;gap:16px;padding:16px 0">
              <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:4px">
                <div style="width:10px;height:10px;border-radius:50%;background:#1e3a8a;box-shadow:0 0 0 3px #bfdbfe;flex-shrink:0" />
                <div style="width:2px;flex:1;background:oklch(90% 0.004 286);margin-top:4px" />
              </div>
              <div style="flex:1;padding-bottom:4px">
                <p style="font-size:12px;font-weight:600;color:#1e40af;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px">LONGO PRAZO</p>
                <!-- Layout: Objetivo (esq) + Risco (dir), por linha -->
                <div style="display:flex;flex-direction:column;gap:10px">
                  <!-- Linha 1: Transição de Carreira (esq) + Risco Financeiro (dir) -->
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start">
                    <div style="display:flex;flex-direction:column;gap:2px">
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
                  <!-- Linha 2: Aposentadoria Planejada (esq) + Risco Longevidade (dir) -->
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start">
                    <div style="display:flex;flex-direction:column;gap:2px">
                      <div v-if="isEditing" style="display:flex;flex-direction:column;gap:4px">
                        <input v-model="draft.timeline[i+1].titulo" class="inline-edit" style="font-weight:600" />
                        <textarea v-model="draft.timeline[i+1].descricao" rows="2" class="textarea-edit" />
                      </div>
                      <template v-else>
                        <p style="font-size:14px;font-weight:600;color:oklch(20% 0.05 250);margin:0 0 2px">{{ data.timeline[i+1].titulo }}</p>
                        <p style="font-size:12px;color:oklch(45% 0.02 250);line-height:1.5;margin:0">{{ data.timeline[i+1].descricao }}</p>
                      </template>
                    </div>
                    <div style="border-radius:8px;border:1px solid #bfdbfe;background:rgba(239,246,255,0.8);padding:12px;font-size:12px;color:#1e40af">
                      <span style="display:inline-block;background:#dbeafe;color:#1e40af;font-weight:700;font-size:11px;padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">{{ data.timeline[i+1].riscoLabel }}</span>
                      <ul style="display:flex;flex-direction:column;gap:3px;margin:4px 0 0;padding:0;list-style:none">
                        <li v-for="(risco, j) in data.timeline[i+1].riscos" :key="j" style="display:flex;align-items:flex-start;gap:6px;font-size:12px;color:#1e40af;line-height:1.4">
                          <span style="margin-top:5px;width:4px;height:4px;border-radius:50%;background:#1e40af;flex-shrink:0;display:inline-block" />
                          <input v-if="isEditing" v-model="draft.timeline[i+1].riscos[j]" class="inline-edit" />
                          <span v-else>{{ risco }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <!-- Itens normais (não Longo Prazo) -->
          <template v-else-if="normalizePeriodo(item.periodo) !== 'LONGO PRAZO'">
            <div style="display:flex;gap:16px;padding:16px 0;border-bottom:1px solid oklch(92% 0.003 260)">
              <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:4px">
                <div style="width:10px;height:10px;border-radius:50%;background:#1e3a8a;box-shadow:0 0 0 3px #bfdbfe;flex-shrink:0" />
                <div style="width:2px;flex:1;background:oklch(90% 0.004 286);margin-top:4px" />
              </div>
              <div style="flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding-bottom:4px">
                <div style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:12px;font-weight:600;color:#1e40af;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 2px">{{ normalizePeriodo(item.periodo) }}</p>
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
          </template>
        </template>
        <div style="background:oklch(97% 0.002 260);border:1px solid oklch(90% 0.005 260);border-radius:8px;padding:12px 16px;margin-top:4px">
          <span style="font-size:12px;font-weight:600;color:oklch(20% 0.05 250);display:block;margin-bottom:4px">Visão de Longo Prazo:</span>
          <span style="font-size:12px;color:oklch(45% 0.02 250);font-style:italic;line-height:1.5;display:block">Cada etapa exigirá preparação financeira específica. O acúmulo de capital deve ser constante para suportar os possíveis picos de despesas. Contar com uma previdência privada é uma ferramenta eficiente de planejamento sucessório, pois garante liquidez imediata para a família, ajudando a cobrir custos como do inventário, que podem ser altos e demorados.</span>
        </div>
      </div>
    </SectionWithIcon>

    <!-- 5. Soluções Propostas -->
    <SectionWithIcon>
      <template #title>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span style="font-size:15px;font-weight:600;color:oklch(20% 0.05 250)">Soluções Propostas</span>
          <select v-if="isEditing" v-model="solucaoVisivel" style="font-size:12px;padding:4px 10px;border-radius:6px;border:1px solid oklch(80% 0.005 260);background:#fff;color:oklch(20% 0.05 250);cursor:pointer;outline:none">
            <option value="ambos">Seguro de Vida + Previdência</option>
            <option value="seguro">Seguro de Vida</option>
            <option value="previdencia">Previdência</option>
          </select>
        </div>
      </template>
      <template #icon>
        <svg style="width:16px;height:16px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      </template>
      <div :style="{ display:'grid', gridTemplateColumns: solucaoVisivel === 'ambos' ? 'repeat(auto-fit,minmax(260px,1fr))' : '1fr', gap:'16px', marginBottom:'0', alignItems:'stretch' }">
        <!-- Proteção (Seguro de Vida) -->
        <div v-if="solucaoVisivel === 'ambos' || solucaoVisivel === 'seguro'" style="display:flex;flex-direction:column;height:100%">
          <p style="font-size:14px;font-weight:500;color:oklch(20% 0.05 250);margin:0 0 8px">Seguro de Vida</p>
          <div style="border:1px solid oklch(90% 0.005 260);border-radius:8px;padding:14px 16px;background:oklch(97% 0.002 260);flex:1">
            <p style="font-size:13px;color:oklch(30% 0.05 250);margin:0 0 10px">Este produto garante:</p>
            <div v-for="(item, i) in data.solucoes.protecao.itens" :key="i" style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
              <CheckIcon />
              <input v-if="isEditing" v-model="draft.solucoes.protecao.itens[i]" class="inline-edit" />
              <span v-else style="font-size:13px;color:oklch(30% 0.05 250)">{{ item }}</span>
            </div>
          </div>
        </div>
        <!-- Previdência -->
        <div v-if="solucaoVisivel === 'ambos' || solucaoVisivel === 'previdencia'" style="display:flex;flex-direction:column;height:100%">
          <p style="font-size:14px;font-weight:500;color:oklch(20% 0.05 250);margin:0 0 8px">Previdência Privada</p>
          <div style="border:1px solid oklch(90% 0.005 260);border-radius:8px;padding:14px 16px;background:oklch(97% 0.002 260);flex:1">
            <p style="font-size:13px;color:oklch(30% 0.05 250);margin:0 0 10px">Este produto garante:</p>
            <div v-for="(item, i) in data.solucoes.previdencia.itens" :key="i" style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
              <CheckIcon />
              <input v-if="isEditing" v-model="draft.solucoes.previdencia.itens[i]" class="inline-edit" />
              <span v-else style="font-size:13px;color:oklch(30% 0.05 250)">{{ item }}</span>
            </div>
            <p style="font-size:12px;color:oklch(45% 0.02 250);line-height:1.6;border-top:1px solid oklch(90% 0.005 260);padding-top:10px;margin:0">
              Com <strong>Benefício Fiscal</strong> relevante <strong>no plano PGBL</strong>. As contribuições podem ser abatidas da base de cálculo do Imposto de Renda, com possibilidade de <strong>dedução de até 12%</strong>.<br /><br />
              E <strong>nos planos PGBL e VGBL</strong> a tributação é realizada apenas no momento do resgate ou da concessão de renda.
            </p>
          </div>
        </div>
      </div>
    </SectionWithIcon>

    <!-- Blocos O Que Você Protege e O Que Você Garante removidos conforme solicitado -->

    <!-- Erros de validação -->
    <div v-if="validationErrors.length > 0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-top:16px">
      <p style="font-size:13px;font-weight:600;color:#dc2626;margin:0 0 4px">Preencha os campos obrigatórios antes de salvar:</p>
      <ul style="margin:0;padding-left:16px">
        <li v-for="err in validationErrors" :key="err" style="font-size:13px;color:#dc2626">{{ err }}</li>
      </ul>
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
import { PROFISSOES } from '~/data/profissoesData'
import type { ResumoData } from '~/stores/jornada'

const emit = defineEmits<{ next: []; 'editing-change': [editing: boolean] }>()

function normalizePeriodo(p: string): string {
  if (p === 'PRÓXIMOS 3-5 ANOS') return 'CURTO PRAZO'
  if (p === 'PRÓXIMOS 5-10 ANOS') return 'MÉDIO PRAZO'
  if (p === 'PRÓXIMOS 10-20 ANOS' || p === 'EM 20 ANOS (60 ANOS)') return 'LONGO PRAZO'
  return p
}

const store = useJornadaStore()

const isEditing = ref(false)
const draft = ref<ResumoData>(JSON.parse(JSON.stringify(store.resumoData)))
const draftProponente = ref({ ...store.detalhamentoData.proponente })
const solucaoVisivel = ref<'ambos' | 'seguro' | 'previdencia'>((store.resumoData.produtoSelecionado as 'ambos' | 'seguro' | 'previdencia') || 'ambos')

// Ocupação com busca
const ocupacaoSearch = ref('')
const showOcupacaoDropdown = ref(false)
const filteredProfissoes = computed(() => {
  const q = ocupacaoSearch.value.trim().toUpperCase()
  if (!q) return PROFISSOES.slice(0, 50)
  return PROFISSOES.filter(p => p.includes(q))
})
function selectOcupacao(prof: string) {
  draftProponente.value.ocupacao = prof
  ocupacaoSearch.value = prof
  showOcupacaoDropdown.value = false
}
function onOcupacaoBlur() {
  setTimeout(() => { showOcupacaoDropdown.value = false }, 150)
}

// Erros de validação
const validationErrors = ref<string[]>([])

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
  ocupacaoSearch.value = store.detalhamentoData.proponente.ocupacao || ''
  validationErrors.value = []
  isEditing.value = true
  emit('editing-change', true)
}

const handleCancel = () => {
  validationErrors.value = []
  isEditing.value = false
  emit('editing-change', false)
}

const handleSave = () => {
  // Validação de campos obrigatórios
  const erros: string[] = []
  if (!draftProponente.value.cpf?.trim()) erros.push('CPF')
  if (!draftProponente.value.nomeCompleto?.trim()) erros.push('Nome Completo')
  if (!draftProponente.value.dataNascimento?.trim()) erros.push('Data de Nascimento')
  if (!draftProponente.value.telefone?.trim()) erros.push('Telefone')
  if (!draftProponente.value.email?.trim()) erros.push('E-mail')
  if (!draftProponente.value.rendaMensal?.trim()) erros.push('Renda Mensal')
  if (draftProponente.value.ocupacao === 'OUTROS (ESPECIFICAR)' && !draftProponente.value.especificacaoOcupacao?.trim()) erros.push('Especificação da Ocupação')
  if (erros.length > 0) {
    validationErrors.value = erros
    return
  }
  validationErrors.value = []
  draft.value.produtoSelecionado = solucaoVisivel.value
  store.saveResumoData(draft.value)
  store.saveDetalhamentoData({ ...store.detalhamentoData, proponente: draftProponente.value })
  store.setProdutoSelecionado(solucaoVisivel.value)
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
