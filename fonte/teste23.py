"""Documentos (receita, atestado, declaração, termo com assinatura), laboratório e parcelas do plano."""
import asyncio
from playwright.async_api import async_playwright
import teste as T
SH='/home/claude/work/shots'
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        async def dlg(d): er.append('dialogo '+d.message); await d.dismiss()
        pg.on('dialog',dlg)
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;UI.zap='web';salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');demoArea();S.perfil={nome:'Rafaela Souza',registro:'SP 12345',cidade:'São Paulo'};salvar();ir('clientes')"); await pg.wait_for_timeout(300)
        await pg.evaluate("window.open=()=>({closed:false,focus(){},location:{}});window.print=()=>{window.__imp=(window.__imp||0)+1}")
        cid=await pg.evaluate("S.clientes[0].id"); nome=await pg.evaluate("S.clientes[0].nome")
        await pg.evaluate(f"historico('{cid}')"); await pg.wait_for_timeout(500)
        tipos=await pg.evaluate("[...document.querySelectorAll('.sheet [data-doc-novo]')].map(b=>b.dataset.docNovo)")
        assert tipos==['receita','atestado','declaracao','termo','lgpd'], tipos
        # receita: texto + modelo + imprimir
        await pg.click('[data-doc-novo=receita]'); await pg.wait_for_timeout(500)
        await pg.fill('#dc-tx','Uso interno\n1. Medicamento X 500 mg ...... 1 caixa\nTomar 1 comprimido de 8 em 8 horas por 5 dias')
        await pg.click('#dc-salvamod'); await pg.wait_for_timeout(200); await pg.fill('#mini-i','Pós-extração'); await pg.click('#mini-ok'); await pg.wait_for_timeout(200)
        assert await pg.evaluate("S.modelosDoc.length")==1
        await pg.click('#dc-imp'); await pg.wait_for_timeout(300)
        imp=await pg.evaluate("document.querySelector('#impressao').innerText")
        assert 'Receita' in imp and 'Rafaela Souza' in imp and 'CRO SP 12345' in imp and nome in imp and 'Medicamento X' in imp, imp
        await pg.evaluate("document.body.classList.remove('imprime')")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # atestado: texto gerado com dias e horário
        await pg.evaluate(f"abreDoc('{cid}','atestado')"); await pg.wait_for_timeout(400)
        await pg.fill('#dc-de','0900'); await pg.fill('#dc-ate','1000'); await pg.select_option('#dc-dias','2'); await pg.wait_for_timeout(200)
        tx=await pg.input_value('#dc-tx'); assert 'das 09:00 às 10:00' in tx and '2 dias de repouso' in tx and nome in tx, tx
        await pg.screenshot(path=f'{SH}/atestado.png',full_page=True)
        await pg.click('#dc-imp'); await pg.wait_for_timeout(300); await pg.evaluate("document.body.classList.remove('imprime')")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # termo com assinatura na tela
        await pg.evaluate(f"abreDoc('{cid}','termo')"); await pg.wait_for_timeout(500)
        tx=await pg.input_value('#dc-tx'); assert nome in tx and 'Autorizo' in tx, tx
        cv=await pg.locator('#dc-ass').bounding_box()
        await pg.mouse.move(cv['x']+30,cv['y']+90); await pg.mouse.down()
        for i in range(12): await pg.mouse.move(cv['x']+40+i*18,cv['y']+60+(i%3)*20)
        await pg.mouse.up()
        await pg.screenshot(path=f'{SH}/termo.png',full_page=True)
        await pg.click('#dc-imp'); await pg.wait_for_timeout(300)
        d=await pg.evaluate("S.documentos.find(d=>d.tipo==='termo')")
        assert d['assinatura'].startswith('data:image/png') and len(d['assinatura'])>500, len(d['assinatura'])
        assert await pg.locator('#impressao img').count()==1
        await pg.evaluate("document.body.classList.remove('imprime')"); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.evaluate(f"historico('{cid}')"); await pg.wait_for_timeout(500)
        assert await pg.locator('.sheet [data-doc]').count()==3
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # documentos ficam nos dados de saúde
        assert await pg.evaluate("CLINICO.includes('documentos')")
        # psicologia: só declaração
        await pg.evaluate("mudaArea('psico',true)"); c2=await pg.evaluate("(S.clientes.push({id:'p1',nome:'Paula',tel:'',email:'',nasc:'',obs:''}),'p1')"); await pg.evaluate(f"historico('{c2}')"); await pg.wait_for_timeout(400)
        r=await pg.evaluate("[...document.querySelectorAll('.sheet [data-doc-novo]')].map(b=>b.dataset.docNovo)"); assert r==['declaracao','contrato','atestadoPsi','relatorio','laudo','parecer','lgpd'], (r, er)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300); await pg.evaluate("mudaArea('odonto')"); cid=await pg.evaluate("S.clientes[0].id")

        # ── laboratório ──
        await pg.evaluate("ir('lab')"); await pg.wait_for_timeout(300)
        await pg.select_option('#lb-cli',cid); await pg.fill('#lb-tr','Coroa'); await pg.fill('#lb-de','36'); await pg.fill('#lb-lab','Lab Sorriso'); await pg.fill('#lb-v','350')
        await pg.fill('#lb-env','01112026'); await pg.fill('#lb-prev','05112026'); await pg.click('#lb-add'); await pg.wait_for_timeout(300)
        l=await pg.evaluate("S.lab[0]"); assert l['enviado']=='2026-11-01' and l['prevista']=='2026-11-05' and l['valor']==350, l
        assert await pg.locator('.pill.bad', has_text='atrasado').count()==1
        await pg.screenshot(path=f'{SH}/lab.png',full_page=True)
        await pg.evaluate("ir('hoje')"); await pg.wait_for_timeout(300)
        assert await pg.locator('.aviso', has_text='atrasado no laboratório').count()==1
        await pg.evaluate("ir('lab')"); await pg.wait_for_timeout(300)
        nd=await pg.evaluate("S.despesas.length")
        await pg.click('[data-lab-volta]'); await pg.wait_for_timeout(400); await pg.click('#lv-ok'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.despesas.length")==nd+1 and await pg.evaluate("S.lab[0].status")=='voltou'
        assert (await pg.evaluate("S.despesas.slice(-1)[0].desc")).startswith('Laboratório · Coroa')
        await pg.click('[data-lab-inst]'); await pg.wait_for_timeout(300); assert await pg.evaluate("S.lab[0].status")=='instalado'
        # menu: laboratório só em odontologia
        assert await pg.evaluate("permitido('lab')")
        await pg.evaluate("mudaArea('estetica')"); await pg.wait_for_timeout(200)
        assert not await pg.evaluate("permitido('lab')") and await pg.locator('#menu button[data-t=lab]').evaluate("b=>b.closest('li').hidden")
        await pg.evaluate("ir('lab')"); await pg.wait_for_timeout(200); assert await pg.evaluate("tela")=='hoje'
        await pg.evaluate("mudaArea('odonto')"); await pg.wait_for_timeout(200)

        # ── parcelas do plano ──
        s0=await pg.evaluate("S.servicos[0].id")
        pid=await pg.evaluate(f"(()=>{{const p=novoPlano('{cid}',[etapaDe(serv('{s0}'),'',1000),etapaDe(serv('{s0}'),'',500)]); salvar(); return p.id}})()")
        await pg.evaluate(f"abrePlano('{pid}')"); await pg.wait_for_timeout(400)
        await pg.click('#pl-parc'); await pg.wait_for_timeout(500)
        assert await pg.input_value('#pc-tot')=='1500'
        await pg.fill('#pc-ent','300'); await pg.select_option('#pc-n','3'); await pg.fill('#pc-v1','10102026'); await pg.wait_for_timeout(200)
        assert 'R$' in await pg.inner_text('#pc-prev') and '400' in await pg.inner_text('#pc-prev')
        nv=await pg.evaluate("S.vendas.length")
        await pg.click('#pc-cria'); await pg.wait_for_timeout(400)
        ps=await pg.evaluate(f"parcDe('{pid}').map(p=>[p.n,p.valor,p.venc,!!p.pago])")
        assert ps==[[0,300,T.HOJE if hasattr(T,'HOJE') else ps[0][2],True],[1,400,'2026-10-10',False],[2,400,'2026-11-10',False],[3,400,'2026-12-10',False]], ps
        assert await pg.evaluate("S.vendas.length")==nv+1
        v=await pg.evaluate("S.vendas.slice(-1)[0]"); assert v['valor']==300 and v['desc']=='Plano de tratamento · entrada', v
        assert await pg.evaluate("conta(S.vendas.slice(-1)[0]).nome")=='Plano de tratamento'
        await pg.screenshot(path=f'{SH}/parcelas.png',full_page=True)
        # recebe a 1ª (atrasada) escolhendo a forma
        await pg.click('[data-pc-ok]'); await pg.wait_for_timeout(300); await pg.click('[data-mf=pix]'); await pg.wait_for_timeout(300)
        assert await pg.evaluate(f"parcDe('{pid}').filter(p=>p.pago).length")==2
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # Hoje e Registrar mostram a atrasada (vence 10/11)
        await pg.evaluate("ir('hoje')"); await pg.wait_for_timeout(300)
        assert await pg.locator('.aviso', has_text='parcela atrasada').count()==1, await pg.inner_text('#view')
        await pg.evaluate("ir('registrar')"); await pg.wait_for_timeout(300)
        assert await pg.locator('[data-cx=parc] [data-rp-ok]').count()==1
        await pg.click('[data-rp-ok]'); await pg.wait_for_timeout(300); await pg.click('[data-mf=dinheiro]'); await pg.wait_for_timeout(300)
        assert await pg.locator('[data-cx=parc]').count()==0
        # transferência não tem taxa
        assert await pg.evaluate("taxaDe('transf',1)")==0 and await pg.evaluate("FORMAS.some(f=>f.k==='transf')")
        ov=await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"); assert ov<=1, ov
        await br.close()
    assert not er, er
    print('SEM ERROS (23)')
asyncio.run(main())
