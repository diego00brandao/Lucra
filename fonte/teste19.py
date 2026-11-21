import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');S.servicos=[{id:'s',nome:'Limpeza',preco:200,custo:0}];S.agenda=[];"
          "const h=hojeISO(),ini=somaDias(h,-dowDe(h)),seg=somaDias(ini,1);"
          "for(let i=0;i<5;i++)S.agenda.push({id:'a'+i,data:seg,hora:String(8+i).padStart(2,'0')+':00',clienteId:'',servicoId:'s',status:i<4?'concluido':'faltou'});"
          "S.agenda.push({id:'c',data:seg,hora:'14:00',clienteId:'',servicoId:'s',status:'cancelado'});"
          "S.expediente={dias:[1,2,3,4,5],ini:'08:00',fim:'18:00',dur:60};salvar();ir('ocupacao')"); await pg.wait_for_timeout(400)
        r=await pg.evaluate("(()=>{const h=hojeISO(),ini=somaDias(h,-dowDe(h));return calcOcupacao(ini,somaDias(ini,6))})()")
        assert r['cap']==50 and r['ocup']==5 and r['falta']==1 and abs(r['taxa']-10)<.01 and r['vagos']==45, r
        tx=await pg.inner_text('#view'); assert '10%' in tx and 'Por dia da semana' in tx
        await pg.screenshot(path='/home/claude/work/ocup.png',full_page=True)
        await pg.click('[data-oc-d="6"]'); await pg.wait_for_timeout(200); assert await pg.evaluate("S.expediente.dias.includes(6)")
        await pg.select_option('#oc-dur','30'); await pg.wait_for_timeout(200)
        r=await pg.evaluate("(()=>{const h=hojeISO(),ini=somaDias(h,-dowDe(h));return calcOcupacao(ini,somaDias(ini,6)).cap})()"); assert r==120, r
        await pg.click('[data-oc=mes]'); await pg.wait_for_timeout(200); await T.checa(pg,'ocupação')
        await br.close()
    assert not er, er; print('SEM ERROS (19)')
asyncio.run(main())
