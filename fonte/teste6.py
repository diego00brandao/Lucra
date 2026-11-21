import asyncio, json, os, urllib.parse as U
from playwright.async_api import async_playwright
import teste as T
SH=T.SHOTS; erros=[]
async def nova(br,w,h):
    ctx=await br.new_context(viewport={'width':w,'height':h},device_scale_factor=2); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
    pg=await ctx.new_page()
    pg.on('pageerror',lambda e:erros.append('pageerror: '+str(e)))
    pg.on('console',lambda m:erros.append('console: '+m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_FAILED' not in m.text else None)
    async def dlg(d): erros.append('DIÁLOGO NATIVO: '+d.message); await d.dismiss()
    pg.on('dialog',dlg)
    await pg.add_init_script("""document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[target=_blank]');if(a){(window.__hrefs=window.__hrefs||[]).push(a.href);e.preventDefault()}},true);
      window.open=(u)=>{(window.__hrefs=window.__hrefs||[]).push(u);return null}; window.print=()=>{window.__printed=(document.querySelector('#impressao')||{}).innerHTML||''}""")
    await pg.goto(T.NOVO); await pg.wait_for_timeout(900); return pg
async def checa(pg,n):
    a=await pg.evaluate(T.ALVOS); e=await pg.evaluate(T.ESTOURO)
    if a: erros.append(f'alvos <44 em {n}: {a[:6]}')
    if e>0: erros.append(f'estouro em {n}: {e}px')
async def sheetTx(pg): return await pg.evaluate("[...document.querySelectorAll('.sheet')].pop().innerText")
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        pg=await nova(br,390,844)
        # boas-vindas: escolher a área
        await pg.evaluate("UI.zap='web';salvarUI()")
        await pg.click('#ob-ok'); await pg.wait_for_timeout(400)
        await pg.click('[data-area=psico]'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.area")=='psico'
        assert await pg.locator('nav button[data-t=clientes] .rot').text_content()=='Pacientes'
        ac=await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ac').trim()"); assert ac.upper()!='#7A2E4D', ac
        await pg.screenshot(path=f'{SH}/90-ob-area.png'); await checa(pg,'ob área')
        await pg.click('#ob-volta'); await pg.wait_for_timeout(300); await pg.click('#ob-demo'); await pg.wait_for_timeout(900)
        st=json.loads(await pg.evaluate("JSON.stringify({a:S.area,s:S.servicos.length,c:S.clientes.length,ag:S.agenda.length,r:S.receber.length,e:S.evolucoes.length,v:S.vendas.length})"))
        print('demo psico',st); assert st['a']=='psico' and st['r']>=3 and st['e']>=10
        # painel
        tx=await pg.inner_text('#view')
        assert 'A RECEBER' in tx.upper() and 'SEPARAR PARA REPOR' not in tx.upper() and 'dos sessões' not in tx, tx[:600]
        await pg.evaluate("ir('lucro')"); await pg.wait_for_timeout(300)
        assert 'Lucro por tipo de sessão' in await pg.inner_text('#view')
        await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'{SH}/91-painel-psico.png',full_page=True); await checa(pg,'painel psico')
        # agenda: série semanal com link
        await pg.evaluate("ir('agenda')"); await pg.wait_for_timeout(500)
        await pg.click('#ag-novo'); await pg.wait_for_timeout(400)
        assert await pg.evaluate("tela")=='novoag' and await pg.input_value('#a-rep')=='' and not await pg.locator('#a-vezes').is_visible()
        assert await pg.locator('label:text("Tipo de sessão")').count()>=1 and await pg.locator('#a-st').is_hidden()
        cid=await pg.evaluate("S.clientes[7].id")
        await pg.select_option('#a-cli',cid)
        alvo30=await pg.evaluate("somaDias(hojeISO(),30)")
        if alvo30[:7]!=await pg.evaluate("hojeISO().slice(0,7)"): await pg.click('#pk-prox'); await pg.wait_for_timeout(150)
        await pg.click(f'.pk-g [data-pk-d="{alvo30}"]')
        n0=await pg.evaluate('S.agenda.length'); await pg.click('#a-add'); await pg.wait_for_timeout(300)
        assert await pg.evaluate('S.agenda.length')==n0 and 'horário' in await pg.inner_text('#toast'), 'salvou sem horário'
        await pg.click('[data-pk-h="07"]'); await pg.click('[data-pk-m="15"]')
        assert await pg.input_value('#a-hora')=='07:15' and await pg.input_value('#a-data')==alvo30
        assert '7h15' in await pg.inner_text('.pk-res')
        await pg.select_option('#a-rep','7'); assert await pg.locator('#a-vezes').is_visible() and await pg.input_value('#a-vezes')==''
        await pg.click('#a-add'); await pg.wait_for_timeout(300); assert await pg.evaluate('S.agenda.length')==n0, 'repetiu sem escolher por quanto tempo'
        await pg.screenshot(path=f'{SH}/91b-novo-ag.png',full_page=True); await checa(pg,'novo agendamento')
        await pg.fill('#a-link','https://meet.google.com/abc-defg-hij'); await pg.select_option('#a-vezes','8')
        await pg.click('#a-add'); await pg.wait_for_timeout(600)
        assert await pg.evaluate("tela")=='agenda' and await pg.evaluate("agDia")==alvo30
        assert await pg.evaluate('S.agenda.length')==n0+8
        assert await pg.evaluate("new Set(S.agenda.slice(-8).map(a=>a.serie)).size")==1
        tx=await pg.input_value('#mz-tx'); assert 'Link da sessão: https://meet.google.com/abc-defg-hij' in tx, tx
        await pg.click('#mz-no'); await pg.wait_for_timeout(300)
        # excluir: este e os próximos
        await pg.evaluate("agDia=somaDias(hojeISO(),30+7*5);render()"); await pg.wait_for_timeout(300)
        await pg.locator('.item:has-text("Heitor") [data-acao=excluir]').first.click(); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{SH}/92-excluir-serie.png'); await checa(pg,'excluir série')
        await pg.click('#xs-todos'); await pg.wait_for_timeout(400)
        assert await pg.evaluate('S.agenda.length')==n0+5, await pg.evaluate('S.agenda.length')
        # atendeu, paga depois → anotação abre sozinha
        await pg.evaluate("agDia=hojeISO();render()"); await pg.wait_for_timeout(300)
        alvo=await pg.evaluate("(()=>{const a=S.agenda.find(a=>a.status==='marcado'&&a.data>=hojeISO()&&!pacotesAbertos().some(p=>p.venda.clienteId===a.clienteId));agDia=a.data;render();return a.id})()")
        await pg.wait_for_timeout(300)
        r0=await pg.evaluate('S.receber.length'); e0=await pg.evaluate('S.evolucoes.length')
        await pg.click(f'[data-ag="{alvo}"][data-acao=concluir]'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'{SH}/93-fechar.png'); await checa(pg,'fechar sessão')
        assert 'Fechar sessão' in await sheetTx(pg)
        await pg.click('#k-dep'); await pg.wait_for_timeout(900)
        assert await pg.evaluate('S.receber.length')==r0+1
        assert await pg.locator('#ev-humor').count()==1, 'anotação não abriu'
        await pg.fill('#ev-foco','Conflito com o chefe'); await pg.locator('#ev-humor').fill('8'); await pg.click('[data-sinal="Ansiedade intensa"]')
        await pg.click('[data-sinal="Sinais de risco"]'); assert await pg.locator('#ev-risco').is_visible()
        await pg.click('[data-evol=melhora]'); await pg.fill('#ev-prox','Registro de pensamentos')
        await pg.screenshot(path=f'{SH}/94-anotacao.png',full_page=True); await checa(pg,'anotação')
        await pg.click('#ev-ok'); await pg.wait_for_timeout(500)
        ev=json.loads(await pg.evaluate("JSON.stringify(S.evolucoes[S.evolucoes.length-1])"))
        assert await pg.evaluate('S.evolucoes.length')==e0+1 and ev['humor']==8 and ev['evolucao']=='melhora' and ev['agId']==alvo and 'Sinais de risco' in ev['sinais'], ev
        assert await pg.locator(f'[data-nota-a="{alvo}"]').count()==1
        # tocar no horário abre a anotação direto
        await pg.locator(f'[data-item-ag="{alvo}"] > .mn').click(); await pg.wait_for_timeout(400)
        assert await pg.locator('#ev-humor').count()==1 and await pg.input_value('#ev-foco')=='Conflito com o chefe'
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # paciente com pacote: usa a sessão do pacote
        pac=await pg.evaluate("(()=>{const p=pacotesAbertos()[0];if(!p)return null;const a=S.agenda.find(a=>a.status==='marcado'&&a.clienteId===p.venda.clienteId);agDia=a.data;render();return [a.id,p.venda.id,p.c.usadas]})()")
        if pac:
            await pg.wait_for_timeout(300); await pg.click(f'[data-ag="{pac[0]}"][data-acao=concluir]'); await pg.wait_for_timeout(400)
            await pg.click('#k-pac'); await pg.wait_for_timeout(500); await pg.click('#ps-ok'); await pg.wait_for_timeout(800)
            assert await pg.evaluate(f"conta(S.vendas.find(v=>v.id==='{pac[1]}')).usadas")==pac[2]+1
            assert await pg.evaluate(f"S.agenda.find(a=>a.id==='{pac[0]}').status")=='concluido'
            assert await pg.locator('#ev-humor').count()==1; await pg.click('#ev-no'); await pg.wait_for_timeout(300)
        else: print('sem pacote aberto no exemplo hoje')
        # faltou → cobrar
        fal=await pg.evaluate("(()=>{const a=S.agenda.find(a=>a.status==='marcado'&&a.data>=hojeISO());agDia=a.data;render();return a.id})()"); await pg.wait_for_timeout(300)
        r0=await pg.evaluate('S.receber.length')
        await pg.click(f'[data-ag="{fal}"][data-acao=faltou]'); await pg.wait_for_timeout(500); await checa(pg,'cobrar falta')
        await pg.click('#fc-ok'); await pg.wait_for_timeout(400)
        assert await pg.evaluate('S.receber.length')==r0+1 and await pg.evaluate(f"S.agenda.find(a=>a.id==='{fal}').status")=='faltou'
        await pg.screenshot(path=f'{SH}/95-agenda-psico.png',full_page=True); await checa(pg,'agenda psico')
        # caixa: a receber
        await pg.evaluate("ir('vendas')"); await pg.wait_for_timeout(500)
        await pg.locator('.sec:has(h2:text("A receber"))').screenshot(path=f'{SH}/96-receber.png'); await checa(pg,'caixa a receber')
        await pg.locator('[data-cob]').first.click(); await pg.wait_for_timeout(400)
        tx=await pg.input_value('#mz-tx'); assert 'valor em aberto de R$' in tx and '{' not in tx, tx
        await pg.click('#mz-no'); await pg.wait_for_timeout(300)
        g=json.loads(await pg.evaluate("JSON.stringify(gruposReceber()[0])"))
        nv=await pg.evaluate('S.vendas.length'); nr=await pg.evaluate('S.receber.length')
        await pg.click(f'[data-rec="{g["cid"]}"]'); await pg.wait_for_timeout(400); await checa(pg,'recebi')
        await pg.screenshot(path=f'{SH}/97-recebi.png')
        await pg.click('#rc-ok'); await pg.wait_for_timeout(500)
        assert await pg.evaluate('S.vendas.length')==nv+len(g['itens']) and await pg.evaluate('S.receber.length')==nr-len(g['itens'])
        assert abs(await pg.evaluate(f"S.vendas.slice(-{len(g['itens'])}).reduce((a,v)=>a+v.valor,0)")-g['total'])<.01
        # histórico: evolução e recibo
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(400)
        assert await pg.locator('h1:text("Pacientes")').count()==1
        ana=await pg.evaluate("S.clientes[0].id")
        await pg.click(f'[data-ver-c="{ana}"]'); await pg.wait_for_timeout(700)
        assert await pg.locator('#h-evo svg.humor').count()==1 and 'subiu' in await pg.inner_text('#h-evo')
        await pg.locator('#h-evo').scroll_into_view_if_needed(); await pg.screenshot(path=f'{SH}/98-evolucao.png'); await checa(pg,'evolução')
        await pg.locator('#h-evo [data-ev]').first.click(); await pg.wait_for_timeout(400)
        assert 'Anotação da sessão' in await sheetTx(pg); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.click('#h-rec'); await pg.wait_for_timeout(500)
        await pg.fill('#rb-cpf','123.456.789-00'); await pg.wait_for_timeout(200)
        rt=await pg.inner_text('#rb-prev'); print(rt)
        assert '23/11/2026' not in rt and 'ANA RIBEIRO' in rt and '123.456.789-00' in rt and 'Atendimento no dia' in rt and 'psicoterapêuticos' in rt and 'Pagador' in rt, rt
        await pg.fill('#rb-n','Laerte Teste'); await pg.fill('#rb-d','229.211.058-02'); await pg.fill('#rb-r','06/146968'); await pg.wait_for_timeout(200)
        rt=await pg.inner_text('#rb-prev'); assert 'LAERTE TESTE' in rt and 'Psicólogo(a) - 06/146968' in rt and 'por 229.211.058-02' in rt, rt
        assert await pg.evaluate("S.perfil.registro")=='06/146968'
        await pg.screenshot(path=f'{SH}/99-recibo.png'); await checa(pg,'recibo')
        await pg.click('#rb-pr'); await pg.wait_for_timeout(300)
        assert 'Atendimento no dia' in (await pg.evaluate('window.__printed||""')) and await pg.evaluate("S.clientes[0].cpf")=='123.456.789-00'
        await pg.click('#rb-zap'); await pg.wait_for_timeout(300)
        h=U.unquote((await pg.evaluate('window.__hrefs'))[-1]); assert '*RECIBO*' in h and 'ANA RIBEIRO' in h and 'Atendimento no dia' in h, h
        await pg.keyboard.press('Escape'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # ajustes: dados, troca de área e volta
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(400); await checa(pg,'ajustes psico')
        await pg.screenshot(path=f'{SH}/100-ajustes.png',full_page=True)
        assert 'Procedimentos, pacotes' in await pg.inner_text('.areas')
        await pg.locator('.dobravel:has-text("Seus dados para recibo")').click(); await pg.fill('#pf-nome','Dra. Teste'); await pg.fill('#pf-reg','06/123456'); await pg.fill('#pf-doc','000.000.000-00'); await pg.click('#pf-ok')
        assert await pg.evaluate("S.perfil.registro")=='06/123456'
        await pg.click('.areas [data-area=odonto]'); await pg.wait_for_timeout(400)
        assert await pg.locator('nav button[data-t=clientes] .rot').text_content()=='Pacientes'
        # áreas separadas: a odontologia começa vazia, sem os pacientes da psicologia
        npsi=await pg.evaluate("JSON.parse(localStorage.getItem(UI.chaves.psico)).clientes.length")
        assert npsi>=8 and await pg.evaluate("S.clientes.length")==0 and await pg.evaluate("S.vendas.length")==0, 'odontologia herdou dados da psicologia'
        assert await pg.evaluate("UI.chaves.psico")!=await pg.evaluate("UI.chaves.odonto")
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(300); await pg.click('.areas [data-area=estetica]'); await pg.wait_for_timeout(300)
        assert await pg.locator('nav button[data-t=clientes] .rot').text_content()=='Clientes'
        ac=await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ac').trim()")
        assert ac in ('','#7A2E4D') or ac.upper()=='#7A2E4D', ac
        # odontologia: exemplo próprio
        await pg.click('.areas [data-area=odonto]'); await pg.wait_for_timeout(300)
        await pg.locator('.dobravel:has-text("Exemplo")').click(); await pg.click('#a-demo'); await pg.wait_for_timeout(300); await pg.click('[data-cf=ok]'); await pg.wait_for_timeout(800)
        assert await pg.evaluate("S.area")=='odonto' and await pg.evaluate("S.servicos.some(s=>s.nome==='Tratamento de canal')")
        await pg.screenshot(path=f'{SH}/101-painel-odonto.png',full_page=True); await checa(pg,'painel odonto')
        for t in ['agenda','clientes','vendas','servicos','sim']:
            await pg.evaluate(f"ir('{t}')"); await pg.wait_for_timeout(400); await checa(pg,'odonto '+t)
        # volta para a psicologia: tudo continua lá, com o nome do consultório dela
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(300); await pg.click('.areas [data-area=psico]'); await pg.wait_for_timeout(400)
        assert await pg.evaluate("S.clientes.length")==npsi and await pg.evaluate("S.perfil.registro")=='06/123456', 'psicologia perdeu dados'
        assert await pg.evaluate("S.area")=='psico' and await pg.evaluate("!S.servicos.some(s=>s.nome==='Tratamento de canal')")
        # escuro + desktop psico
        await pg.evaluate("demoArea()"); await pg.click('#b-tema'); await pg.set_viewport_size({'width':1366,'height':860})
        await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(600); await pg.screenshot(path=f'{SH}/102-desk-psico-escuro.png'); await checa(pg,'desk psico')
        await br.close()
    print('\n'.join(erros) if erros else 'SEM ERROS (6)')
asyncio.run(main())
