## Escopo desta passada

O pedido é grande (10 itens). Para manter o consumo de créditos controlado, proponho dividir em **2 entregas**. Esta é a **Entrega A** (alta prioridade visual + correções). Confirma e eu sigo.

---

### Entrega A — agora (esta passada)

1. **Bug das réguas sobrepondo o quadro**
   - Hoje `Rulers` é desenhado com `position: absolute` por cima do canvas (offsetX/offsetY fixo em 48), sobrepondo o quadro.
   - Vou reservar uma "calha" para a régua: o wrapper do canvas passa a ter `padding-top: RULER_SIZE` e `padding-left: RULER_SIZE` quando `showMeasures` está ligado, e o quadro só começa **depois** dessa área. Comportamento estilo Canva/Figma.
   - As réguas seguem o scroll do canvas, mas nunca sobre o quadro.

2. **Remover "Debug Bornes" da Toolbar**
   - Tira o botão `<ToolBtn label="Debug bornes">` do `Toolbar.tsx`.
   - Mantém o estado `debugCps` no store (sem UI) por compat — o overlay de debug deixa de aparecer.

3. **Toggle "Exibir Medidas"**
   - Já existe `showMeasures` no store. Vou adicionar um botão `📏 Medidas` na Toolbar (no lugar do Debug Bornes) usando `toggleMeasures`.
   - Quando OFF: ocultar réguas, cotas temporárias e cotas fixadas.
   - Quando ON: tudo visível.

4. **Medidas automáticas durante drag (Canva-style)**
   - Durante `move`/`resize` de uma entidade, mostrar overlay com:
     - distância até a borda esquerda/direita/topo/base do quadro
     - guias de alinhamento (snap lines verticais/horizontais) quando alinhar com outra entidade — com valor em `mm`/`cm`
   - As cotas só aparecem enquanto o ponteiro está pressionado; somem ao soltar.
   - Implementado dentro de `MeasurementOverlay.tsx` lendo `dragRef` via um pequeno estado `dragInfo` no Canvas.

5. **Cores nas formas (finalização)**
   - O tipo `Shape` já tem `fill`, `stroke`, `strokeWidth`, `opacity`, `dashed`.
   - Vou adicionar no `PropertiesPanel`, na seção "Forma", controles que faltam:
     - estilo da borda: sólida / tracejada / pontilhada (campo novo `strokeStyle`)
     - cantos arredondados (`cornerRadius`) para retângulo/quadrado/callout
   - Garantir que `ShapeGlyph` respeita `strokeStyle` (mapeia para `strokeDasharray`) e `cornerRadius`.

---

### Entrega B — próxima passada (não nesta)

6. Sistema de **medidas fixadas** (cotas permanentes salvas no projeto)
7. Novo tipo de elemento **"Linha de Medida"** (horizontal/vertical/livre) com setas, unidade, valor manual
8. Cores configuráveis em setas / linhas decorativas / indicadores (auditoria item a item)
9. Persistência das medidas no Supabase (depende de 6 e 7)

Esses 4 itens são significativos (novo tipo de entidade, novo grupo de ferramentas, migração leve do shape do projeto) e justificam uma passada separada para revisar o desenho antes de implementar.

---

### Detalhes técnicos

- **Não vou alterar**: cores globais, sistema de fios, sistema de bornes, Supabase, identidade visual.
- **Arquivos editados na Entrega A**:
  - `src/components/editor/Canvas.tsx` — padding para as réguas, hook de `dragInfo` para o overlay
  - `src/components/editor/Rulers.tsx` — desenhar dentro da calha reservada (sem sobreposição)
  - `src/components/editor/MeasurementOverlay.tsx` — cotas durante drag, snap lines com valor
  - `src/components/editor/Toolbar.tsx` — remove Debug Bornes, adiciona toggle "Medidas"
  - `src/components/editor/PropertiesPanel.tsx` — controles de estilo de borda + cantos arredondados
  - `src/components/editor/ShapeGlyph.tsx` — respeitar `strokeStyle`/`cornerRadius`
  - `src/lib/editor-store.ts` — adiciona campos opcionais `strokeStyle` e `cornerRadius` em `Shape`

Posso seguir com a **Entrega A**?