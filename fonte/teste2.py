import asyncio, json, os
from playwright.async_api import async_playwright
import teste as T
D=os.path.dirname(os.path.abspath(__file__)); SH=T.SHOTS
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        pg=await T.nova(br,390,844)
        await pg.click('#ob-demo'); await pg.wait_for_timeout(900)
        await pg.evaluate("(()=>{const c=S.clientes[0]; c.nome='Diego Brandão'; c.tel='(11) 98098-4102'; S.clientes=[c]; S.vendas.forEach(v=>{v.clienteId=c.id;v.cliente=c.nome}); S.agenda.forEach(a=>a.clienteId=c.id); salvar(); render()})()")  # fixture: cliente único com telefone
        await pg.evaluate("UI.mod={equipe:true,estoque:true,contas:true};salvarUI();render()")
        base=await pg.evaluate(T.RES)
        # aniversário + contas + estoque no painel
        await pg.evaluate("S.clientes[0].nasc=hojeISO();salvar()")
        await pg.evaluate("ir('vendas')"); await pg.wait_for_timeout(500)
        await pg.fill('#ct-desc','Aluguel'); await pg.fill('#ct-valor','2200'); await pg.check('#ct-rep'); await pg.click('#ct-add'); await pg.wait_for_timeout(400)
        await pg.click('.dobra summary'); await pg.fill('#ct-desc','Boleto fornecedor'); await pg.fill('#ct-valor','350,50'); await pg.click('#ct-add'); await pg.wait_for_timeout(400)
        assert await pg.evaluate('S.contas.length')==2
        assert await pg.evaluate(T.RES)==base, 'conta agendada não pode mexer no mês'
        await pg.locator('.sec:has(h2:text("Contas a pagar"))').screenshot(path=f'{SH}/30-contas.png'); await T.checa(pg,'contas')
        nd=await pg.evaluate('S.despesas.length')
        await pg.locator('[data-ct-pg]').first.click(); await pg.wait_for_timeout(400)
        await pg.locator('[data-ct-pg]').first.click(); await pg.wait_for_timeout(400)
        st=json.loads(await pg.evaluate('JSON.stringify({d:S.despesas.length,c:S.contas,h:hojeISO()})'))
        assert st['d']==nd+2 and len(st['c'])==1 and st['c'][0]['rep'] and st['c'][0]['venc']>st['h'], st
        # equipe
        await pg.evaluate("ir('servicos')"); await pg.wait_for_timeout(500)
        await pg.fill('#eq-nome','Ana'); await pg.click('#eq-add'); await pg.wait_for_timeout(300)
        await pg.fill('#eq-nome','Bia'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        await T.checa(pg,'serviços+equipe')
        # estoque: 10 em estoque, mínimo 8, gasta 1 por limpeza de pele
        await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(400); await pg.click('#ir-res'); await pg.wait_for_timeout(500)
        await pg.fill('#pr-nome','Máscara calmante'); await pg.fill('#pr-qtd','10'); await pg.fill('#pr-min','8')
        await pg.select_option('#pr-serv',index=1); await pg.click('#pr-add'); await pg.wait_for_timeout(400)
        assert await pg.evaluate('saldo(S.produtos[0])')==10
        # 3 atendimentos com profissional
        await pg.evaluate("ir('vendas')"); await pg.wait_for_timeout(500)
        for i in range(3):
            await pg.select_option('#f-prof',index=1+i%2); await pg.click('#f-add'); await pg.wait_for_timeout(350)
        assert await pg.evaluate('saldo(S.produtos[0])')==7, await pg.evaluate('saldo(S.produtos[0])')
        assert await pg.evaluate("S.vendas.filter(v=>v.profId).length")==3
        rp=json.loads(await pg.evaluate("JSON.stringify(repasses(mesAtual()))"))
        assert len(rp)==2 and abs(sum(r['valor'] for r in rp)-3*220*.30)<.01, rp
        await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{SH}/31-painel2.png',full_page=True); await T.checa(pg,'painel 2')
        for t in ['Contas da semana','produto(s) acabando']:
            assert await pg.locator(f'text={t}').count()>=1, t
        assert await pg.locator('text=Comissões a repassar').count()==0, 'painel só com dinheiro do mês'
        await pg.evaluate("ir('lucro')"); await pg.wait_for_timeout(400)
        assert await pg.locator('text=Comissões a repassar').count()>=1
        await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(400)
        assert await pg.locator('text=Aniversariantes').count()==0 and await pg.locator('text=Hoje ·').count()==0, 'painel com coisa de paciente'
        await pg.evaluate("ir('agenda')"); await pg.wait_for_timeout(400)
        assert await pg.locator('text=Aniversariantes de').count()==1, 'aniversariantes não foram para a agenda'
        await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(400)
        await pg.click('#ir-res'); await pg.wait_for_timeout(500)
        await pg.locator('.sec:has(h2:text("Estoque"))').screenshot(path=f'{SH}/32-estoque.png'); await T.checa(pg,'estoque')
        await pg.click('[data-pr-conta]'); await pg.wait_for_timeout(400); await pg.fill('#pc-qtd','20'); await pg.click('#pc-ok'); await pg.wait_for_timeout(400)
        assert await pg.evaluate('saldo(S.produtos[0])')==20
        # agenda: confirmar
        await pg.evaluate("ir('agenda')"); await pg.wait_for_timeout(500)
        await pg.evaluate("window.open=(u,n)=>{window.__href=u;window.__alvo=n;return null}")
        # agendar (pelos botões de dia e hora) abre a prévia do aviso de reserva
        await pg.evaluate("ir('novoag')"); await pg.wait_for_timeout(400)
        await pg.select_option('#a-cli',index=1); await pg.click('[data-pk-h="18"]'); await pg.click('[data-pk-m="30"]'); await pg.click('#a-add'); await pg.wait_for_timeout(600)
        tx=await pg.input_value('#mz-tx')
        assert tx.startswith('Oi, *Diego*! Seu horário está garantido: *') and ', às *18:30*, para *' in tx and '{' not in tx, tx
        await pg.screenshot(path=f'{SH}/50-reserva.png'); await T.checa(pg,'folha reserva')
        await pg.click('#mz-ok'); await pg.wait_for_timeout(400)
        assert 'WhatsApp neste computador' in await pg.inner_text('.sheet-bg:last-child .sheet'), 'não perguntou app ou web'
        await pg.screenshot(path=f'{SH}/50b-zap-pergunta.png'); await T.checa(pg,'pergunta whatsapp')
        await pg.click('[data-zm=web]'); await pg.wait_for_timeout(700)
        h=await pg.evaluate('window.__href'); assert h.startswith('https://web.whatsapp.com/send?phone=5511980984102&text=Oi') and 'garantido' in h, h
        assert await pg.evaluate('window.__alvo')=='lucra-whatsapp' and await pg.evaluate('UI.zap')=='web'
        assert await pg.locator('text=reserva avisada').count()==1
        # lembrete, editado antes de enviar
        await pg.locator('[data-msg-a]').first.click(); await pg.wait_for_timeout(500)
        tx=await pg.input_value('#mz-tx'); assert tx.startswith('Oi, Diego! Passando para lembrar do seu horário em ') and '{' not in tx, tx
        await pg.fill('#mz-tx',tx+' Até lá!'); await pg.click('#mz-ok'); await pg.wait_for_timeout(900)
        import urllib.parse as U
        h=U.unquote(await pg.evaluate('window.__href')); assert h.endswith('Até lá!'), h
        assert await pg.locator('text=lembrete enviado').count()>=1
        assert await pg.evaluate("preenche(MSG_PAD.lembrete,{nome:'Ana',data:'10/11/26',hora:''})")=='Oi, Ana! Passando para lembrar do seu horário em 10/11/26. Posso confirmar a sua presença?\nSe não puder vir, me avise assim que souber.'
        await pg.screenshot(path=f'{SH}/33-agenda.png'); await T.checa(pg,'agenda conf')
        # clientes: ranking e sumidos
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(500)
        assert await pg.locator('.rank').count()==1
        await pg.click('[data-ord-c=sumidos]'); await pg.wait_for_timeout(300); await T.checa(pg,'clientes sumidos')
        await pg.screenshot(path=f'{SH}/34-clientes.png')
        await pg.click('[data-ord-c=lucro]'); await pg.wait_for_timeout(300)
        # fotos
        await pg.click('[data-ver-c]'); await pg.wait_for_timeout(700)
        await pg.click('#ft-novo'); await pg.wait_for_timeout(400); await pg.click('#fn-ok'); await pg.wait_for_timeout(600)
        for t,f in (('antes','foto1.jpg'),('depois','foto2.jpg')):
            async with pg.expect_file_chooser() as fc: await pg.click(f'[data-ft-add][data-t={t}]')
            await (await fc.value).set_files(os.path.join(D,f)); await pg.wait_for_timeout(1200)
        fs=json.loads(await pg.evaluate("FOTOS.todos().then(r=>JSON.stringify(r.map(x=>[x.titulo,x.antes.length,x.depois.length,x.antes.slice(0,22)])))"))
        assert len(fs)==1 and fs[0][1]>1000 and fs[0][2]>1000 and fs[0][3].startswith('data:image/jpeg'), fs
        dim=await pg.evaluate("new Promise(r=>{const i=new Image();i.onload=()=>r([i.width,i.height]);FOTOS.todos().then(x=>i.src=x[0].antes)})"); assert dim==[960,1280], dim
        await pg.locator('#h-fotos').scroll_into_view_if_needed(); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'{SH}/35-fotos.png'); await T.checa(pg,'fotos')
        await pg.click('[data-ft-ver][data-t=antes]'); await pg.wait_for_timeout(500); await pg.screenshot(path=f'{SH}/36-foto-ver.png'); await T.checa(pg,'foto ver')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # backup leva as fotos e a restauração traz de volta
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(400)
        async with pg.expect_download() as dl: await pg.click('#a-exp')
        caminho=os.path.join(D,'bk.json'); await (await dl.value).save_as(caminho)
        bk=json.load(open(caminho)); assert len(bk['fotos'])==1 and len(bk['contas'])==1 and len(bk['equipe'])==2
        await pg.click('#a-del'); await pg.wait_for_timeout(400); await pg.click('[data-cf=ok]'); await pg.wait_for_timeout(700)
        assert await pg.evaluate("FOTOS.todos().then(r=>r.length)")==0 and await pg.evaluate('S.vendas.length')==0
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(400)
        async with pg.expect_file_chooser() as fc: await pg.click('#a-imp')
        await (await fc.value).set_files(caminho); await pg.wait_for_timeout(1200)
        assert await pg.evaluate("FOTOS.todos().then(r=>r.length)")==1 and await pg.evaluate('S.equipe.length')==2 and 'fotos' not in json.loads(await pg.evaluate('JSON.stringify(S)'))
        # orçamento
        await pg.evaluate("ir('sim')"); await pg.wait_for_timeout(400); await pg.click('[data-sim-aba=orc]'); await pg.wait_for_timeout(400)
        await pg.select_option('#o-cli',index=1)
        await pg.click('#o-add'); await pg.wait_for_timeout(300)
        await pg.select_option('#o-serv',index=4); await pg.select_option('#o-sess','5'); await pg.click('#o-add'); await pg.wait_for_timeout(300)
        await pg.fill('#o-desc','70'); await pg.select_option('#o-forma','parc'); await pg.select_option('#o-parc','3'); await pg.wait_for_timeout(300)
        prev=json.loads(await pg.evaluate('JSON.stringify(calcOrc(orc))')); assert prev['total']==220+650-70, prev
        await pg.fill('#o-val','2026-12-10'); await pg.dispatch_event('#o-val','change')
        txt=await pg.evaluate('textoOrc(orc)')
        assert 'sobra' not in txt.lower() and '*O que está incluso:* 1x Limpeza de pele profunda, 5x ' in txt and '*Investimento:* R$ 800,00' in txt and '*Válido até:* 10/12/2026' in txt and txt.startswith('Oi, Diego! Seu orçamento ficou pronto:') and '{' not in txt, txt
        assert await pg.evaluate("preenche(MSG_PAD.reserva,{nome:'Ana',data:'10/11/26',hora:'',procedimento:''})")=='Oi, *Ana*! Seu horário está garantido: *10/11/26*. Se surgir algum imprevisto, me avise com antecedência para eu conseguir remarcar. Até lá!'
        assert (await pg.evaluate("textoOrc(Object.assign({},orc,{clienteId:''}))")).startswith('Oi! Seu orçamento ficou pronto:')
        await pg.click('#o-zap'); await pg.wait_for_timeout(500); await pg.screenshot(path=f'{SH}/51-orc-msg.png'); await T.checa(pg,'folha orçamento')
        await pg.click('#mz-ok'); await pg.wait_for_timeout(900)
        assert 'Investimento' in await pg.evaluate('window.__href')
        await pg.screenshot(path=f'{SH}/37-orc.png',full_page=True); await T.checa(pg,'orçamento')
        await pg.click('#o-salva'); await pg.wait_for_timeout(400)
        nv=await pg.evaluate('S.vendas.length')
        await pg.click('[data-o-fecha]'); await pg.wait_for_timeout(400); await pg.click('[data-cf=ok]'); await pg.wait_for_timeout(500)
        real=await pg.evaluate('S.vendas.slice(-2).reduce((a,v)=>a+conta(v).lucro,0)')
        assert await pg.evaluate('S.vendas.length')==nv+2 and abs(real-prev['lucro'])<.02, (real,prev['lucro'])
        assert await pg.evaluate('pacotesAbertos().some(p=>p.c.restam===5)')
        await T.checa(pg,'orçamento salvo')
        # modelos editáveis nos Ajustes
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(400); await T.checa(pg,'ajustes mensagens')
        await pg.locator('.sec:has(h2:text("Mensagens do WhatsApp"))').screenshot(path=f'{SH}/52-ajustes-msg.png')
        await pg.fill('#mg-lembrete','Oi {nome}, te espero dia {data} às {hora}!'); await pg.click('#mg-ok'); await pg.wait_for_timeout(400)
        assert await pg.evaluate("textoAg({clienteId:S.clientes[0].id,servicoId:'',data:'2026-11-12',hora:'09:00'},'lembrete')")=='Oi Diego, te espero dia 12/11/26 às 09:00!'
        assert json.loads(await pg.evaluate("localStorage.getItem('lucra:v1')"))['msgs']=={'lembrete':'Oi {nome}, te espero dia {data} às {hora}!'}
        await pg.click('#mg-pad'); await pg.wait_for_timeout(400); await pg.click('[data-cf=ok]'); await pg.wait_for_timeout(400)
        assert await pg.evaluate("msgDe('lembrete')===MSG_PAD.lembrete && !('msgs' in S)")
        # desktop + escuro
        await pg.click('#b-tema'); await pg.set_viewport_size({'width':1366,'height':900}); await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{SH}/38-desk2.png',full_page=True); await T.checa(pg,'desk 2')
        await br.close()
    print('\n'.join(T.erros) if T.erros else 'SEM ERROS (2)')
asyncio.run(main())
