# ── sexta leva: imprevisto no dia (cancelar, avisar, remarcar) ──
js = js.replace('/* ══════════ BOAS-VINDAS', rd('dia.js') + '/* ══════════ BOAS-VINDAS', 1)
rep("function posRender(el){ dobrar(el);", "function posRender(el){ extrasAgenda(el); dobrar(el);")
rep("    ${campo('orcamento',", "    ${campo('cancelamento','Usada em “Imprevisto? Cancelar os horários deste dia”, na Agenda. Usa {nome}, {data}, {hora} e {motivo}.')}\n    ${campo('orcamento',")
rep("As três mensagens voltam ao texto que veio com o Lucra.", "As mensagens voltam ao texto que veio com o Lucra.")
