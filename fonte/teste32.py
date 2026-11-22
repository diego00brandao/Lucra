"""Pacote: pergunta quanto foi pago; o resto vai para A receber; falta desconta do pacote; sem fatura."""
import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('psico');demoArea()")
        await pg.wait_for_timeout(500); assert await pg.locator('.sheet').count()==0, 'perguntou ao carregar o exemplo'
        await pg.evaluate("S.clientes.push({id:'pk',nome:'Paula Pacote',tel:'11999990000',email:'',nasc:'',obs:''});S.servicos[0].preco=120;salvar();ir('registrar')"); await pg.wait_for_timeout(400)
        sid=await pg.evaluate("S.servicos[0].id"); nv=await pg.evaluate("S.vendas.length"); nr=await pg.evaluate("S.receber.length")
        await pg.select_option('#f-cli','pk'); await pg.select_option('#f-serv',sid); await pg.wait_for_timeout(100)
        await pg.select_option('#f-sess','4'); await pg.fill('#f-valor','450'); await pg.dispatch_event('#f-valor','input')
        await pg.click('#f-add'); await pg.wait_for_timeout(700)
        assert 'Quanto já foi pago' in await pg.inner_text('.sheet')
        await pg.click('[data-pg-op=parte]'); await pg.fill('#pg-v','200'); await pg.click('#pg-ok'); await pg.wait_for_timeout(400)
        v=await pg.evaluate("S.vendas.slice(-1)[0]"); assert v['valor']==200 and v['sessoes']==4 and v['pacTotal']==450, v
        r=await pg.evaluate("S.receber.slice(-1)[0]"); assert r['valor']==250 and r['clienteId']=='pk' and 'Restante do pacote' in r['desc'], r
        assert await pg.evaluate("S.vendas.length")==nv+1 and await pg.evaluate("S.receber.length")==nr+1
        # paga o restante depois: entra no caixa com a descrição certa
        await pg.evaluate("receberSheet('pk')"); await pg.wait_for_timeout(400); await pg.click('#rc-ok'); await pg.wait_for_timeout(400)
        v2=await pg.evaluate("S.vendas.slice(-1)[0]"); assert v2['valor']==250 and v2['desc'].startswith('Restante do pacote'), v2
        assert (await pg.evaluate("conta(S.vendas.slice(-1)[0]).nome")).startswith('Restante')
        assert await pg.locator('.sheet').count()==0
        # pacote sem pagar nada
        await pg.evaluate("ir('registrar')"); await pg.wait_for_timeout(300)
        await pg.select_option('#f-cli','pk'); await pg.select_option('#f-serv',sid); await pg.select_option('#f-sess','4'); await pg.fill('#f-valor','400'); await pg.dispatch_event('#f-valor','input')
        await pg.click('#f-add'); await pg.wait_for_timeout(700); await pg.click('[data-pg-op=nada]'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.vendas.slice(-1)[0].valor")==0 and await pg.evaluate("S.receber.slice(-1)[0].valor")==400
        # falta de quem tem pacote: desconta sessão, não cobra 120
        await pg.evaluate(f"S.falta={{cobrar:true,horas:24,auto:true}};S.agenda.push({{id:'fx',clienteId:'pk',servicoId:'{sid}',data:hojeISO(),hora:'09:00',status:'marcado'}});salvar();agDia=hojeISO();ir('agenda')"); await pg.wait_for_timeout(400)
        nr=await pg.evaluate("S.receber.length"); us=await pg.evaluate("pacotesAbertos().filter(p=>p.venda.clienteId==='pk')[0].c.usadas")
        await pg.click('[data-ag="fx"][data-acao="faltou"]'); await pg.wait_for_timeout(500)
        assert 'tem um pacote' in await pg.inner_text('.sheet'); await pg.click('#fp-pac'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.receber.length")==nr and await pg.evaluate("pacotesAbertos().filter(p=>p.venda.clienteId==='pk')[0].c.usadas")==us+1
        # agendamento que repete: "pacote de 4 sessões já pago" vai para o caixa
        await pg.evaluate("ir('novoag')"); await pg.wait_for_timeout(400)
        assert await pg.locator('#a-pac-box[hidden]').count()==1
        await pg.select_option('#a-cli','pk'); await pg.select_option('#a-serv',sid)
        await pg.evaluate("document.querySelector('#a-hora').value='10:00'")
        await pg.select_option('#a-rep','7'); await pg.select_option('#a-vezes','4'); await pg.wait_for_timeout(100)
        assert await pg.locator('#a-pac-box:not([hidden])').count()==1 and await pg.inner_text('#a-pac-n')=='4'
        await pg.check('#a-pac'); assert await pg.input_value('#a-pac-v')=='480'
        await pg.fill('#a-pac-v','450'); await pg.select_option('#a-pac-f','debito')
        nv=await pg.evaluate("S.vendas.length"); na=await pg.evaluate("S.agenda.length")
        await pg.click('#a-add'); await pg.wait_for_timeout(600)
        assert await pg.evaluate("S.agenda.length")==na+4 and await pg.evaluate("S.vendas.length")==nv+1
        v=await pg.evaluate("S.vendas.slice(-1)[0]"); assert v['valor']==450 and v['sessoes']==4 and v['forma']=='debito' and v['clienteId']=='pk', v
        assert await pg.locator('.sheet', has_text='Quanto já foi pago').count()==0; await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # fechamento sem o botão Fatura
        await pg.evaluate("ir('fechamento')"); await pg.wait_for_timeout(400); assert await pg.locator('[data-fc-fat]').count()==0
        await br.close()
    assert not er, er
    print('SEM ERROS (32)')
asyncio.run(main())
