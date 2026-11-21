# ── sétima leva: alinhamento dos formulários no celular ──
rep("const brlG=v=>{", "const vg=v=>String(v==null?'':v).replace('.',',');   /* número em campo: vírgula decimal */\nconst brlG=v=>{")
for k in ['t.pix','t.dinheiro','t.debito','t.cred1','t.parc','t.parcExtra','S.imposto']:
    rep('inputmode="decimal" value="${%s}">' % k, 'inputmode="decimal" value="${vg(%s)}">' % k)
rep("b.hidden=!S.servicos.length||tela==='ajustes';", "b.hidden=!S.servicos.length||tela==='ajustes'||tela==='servicos';")
