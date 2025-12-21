# Debug - Tela em Branco

## Possíveis Causas

1. **Backend não está rodando**
   - O `UserContext` faz uma chamada à API `/auth/me` quando carrega
   - Se a API não estiver disponível, pode causar problemas
   - **Solução**: Certifique-se de que o backend está rodando na porta 3001

2. **Erro de JavaScript não capturado**
   - Abra o console do navegador (F12) e verifique se há erros
   - Procure por erros em vermelho no console

3. **CSS não está sendo carregado**
   - Verifique se o Tailwind CSS está sendo processado corretamente
   - Verifique se há erros no console relacionados ao CSS

4. **Service Worker causando problemas**
   - O código já tenta desregistrar service workers em desenvolvimento
   - Mas pode haver problemas com cache antigo

## Como Diagnosticar

1. Abra o console do navegador (F12)
2. Verifique se há erros em vermelho
3. Verifique a aba Network para ver se os arquivos estão sendo carregados
4. Verifique se o backend está rodando: `http://localhost:3001/api/auth/me`

## Soluções Aplicadas

1. ✅ Adicionado tratamento de erros melhor no `UserContext`
2. ✅ Adicionados fallbacks visuais no `App.tsx` e `Splash.tsx`
3. ✅ Adicionados estilos inline para garantir visibilidade
4. ✅ Adicionado fallback no `index.html`

## Próximos Passos

1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Verificar se o backend está rodando
3. Verificar o console do navegador para erros específicos
4. Tentar abrir em modo anônimo para descartar problemas de cache/extensões





