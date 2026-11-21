"""Psicologia: recibos em lote, fatura com Pix, contato de emergência e aviso de quem parou de vir."""
import asyncio
from playwright.async_api import async_playwright
import teste as T
SH='/home/claude/work/shots'
async def main():
    er=[]; abriu=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.expose_function('abriuZap',lambda u:abriu.append(u))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;UI.zap='web';salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('psico');demoArea();S.perfil={nome:'Crysthian Lima',doc:'12345678909',registro:'06/1'};salvar();window.open=(u)=>{abriuZap(String(u));return {closed:false,focus(){},location:{}}}")
        # fechamento: chave Pix, fatura e recibos em lote
        # dados profissionais e assinatura em Configurações, uma vez só
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(400)
        if await pg.locator('#sec-perfil .dobravel[aria-expanded="false"]').count(): await pg.click('#sec-perfil .dobravel'); await pg.wait_for_timeout(200)
        await pg.fill('#pf-pix','crys@pix.com'); await pg.fill('#pf-prof','Psicólogo clínico')
        await pg.locator('#pf-ass').scroll_into_view_if_needed(); await pg.wait_for_timeout(150)
        b=await pg.locator('#pf-ass').bounding_box(); await pg.mouse.move(b['x']+30,b['y']+80); await pg.mouse.down()
        for i in range(6): await pg.mouse.move(b['x']+50+i*25,b['y']+40+(i%2)*50)
        await pg.mouse.up(); await pg.click('#pf-ok'); await pg.wait_for_timeout(400)
        assert await pg.evaluate("S.perfil.pix")=='crys@pix.com' and (await pg.evaluate("S.perfil.assinatura")).startswith('data:image') and await pg.evaluate("S.perfil.nome")=='Crysthian Lima'
        assert await pg.locator('#pf-assv img').count()==1
        await pg.evaluate("abreDoc(S.clientes[0].id,'declaracao')"); await pg.wait_for_timeout(400)
        assert await pg.is_checked('#dc-euinc'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate("ir('fechamento')"); await pg.wait_for_timeout(400)
        cid=await pg.evaluate("document.querySelector('[data-fc-rec]').dataset.fcRec")
        await pg.evaluate(f"cli('{cid}').tel='11955554444';salvar();render()"); await pg.wait_for_timeout(300)
        await pg.click(f'[data-fc-zap="{cid}"]'); await pg.wait_for_timeout(300)
        assert abriu and 'crys%40pix.com' in abriu[-1], abriu[-1:]
        await pg.click(f'[data-fc-fat="{cid}"]'); await pg.wait_for_timeout(300)
        t=await pg.inner_text('#impressao'); assert 'Fatura' in t and 'A pagar' in t and 'crys@pix.com' in t, t[:300]
        await pg.evaluate("document.body.classList.remove('imprime')")
        await pg.click('#fc-lote'); await pg.wait_for_timeout(400); await pg.click('.sheet .btn.pri'); await pg.wait_for_timeout(400)
        n=await pg.locator('#impressao .lote-pg').count(); assert n>=2, n
        assert await pg.locator('#impressao .lote-pg .recibo').count()==n
        await pg.evaluate("document.body.classList.remove('imprime')")
        await pg.screenshot(path=f'{SH}/fechamento2.png',full_page=True)
        # contato de emergência
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(300)
        await pg.click(f'[data-ed-c="{cid}"]'); await pg.wait_for_timeout(300)
        await pg.fill('#c-emn','Maria (mãe)'); await pg.fill('#c-emt','11987654321'); assert await pg.input_value('#c-emt')=='(11) 98765-4321'
        await pg.click('#c-add'); await pg.wait_for_timeout(300)
        assert await pg.evaluate(f"cli('{cid}').emerg")=={'nome':'Maria (mãe)','tel':'(11) 98765-4321'}
        await pg.evaluate(f"historico('{cid}')"); await pg.wait_for_timeout(500)
        assert 'Maria (mãe)' in await pg.inner_text('.sheet .emerg-n') and await pg.locator('.sheet .emerg-n a[href="tel:+5511987654321"]').count()==1
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # quem parou de vir: 4 sessões semanais e nada há 30 dias
        await pg.evaluate("""S.clientes.push({id:'pv',nome:'Paulo Vieira',tel:'',email:'',nasc:'',obs:''});
          [58,51,44,37].forEach((d,i)=>S.agenda.push({id:'pv'+i,clienteId:'pv',servicoId:S.servicos[0].id,data:somaDias(hojeISO(),-d),hora:'10:00',status:'concluido'})); salvar(); ir('hoje')"""); await pg.wait_for_timeout(400)
        av=pg.locator('.aviso', has_text='parou de vir'); 
        if not await av.count(): av=pg.locator('.aviso', has_text='pararam de vir')
        assert await av.count()==1 and 'Paulo' in await av.inner_text()
        await av.locator('button').click(); await pg.wait_for_timeout(300); assert await pg.evaluate("[tela,ordCli]")==['clientes','sumidos']
        # quem tem sessão marcada não entra
        await pg.evaluate("S.agenda.push({id:'pvx',clienteId:'pv',servicoId:S.servicos[0].id,data:somaDias(hojeISO(),3),hora:'10:00',status:'marcado'})")
        assert not await pg.evaluate("pararamDeVir().some(x=>x.c.id==='pv')")
        await br.close()
    assert not er, er
    print('SEM ERROS (28)')
asyncio.run(main())
