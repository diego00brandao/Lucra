import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');S.clientes=[{id:'a',nome:'Ana Ribeiro',tel:'',email:'',nasc:'',obs:''}];salvar();ir('ajustes')"); await pg.wait_for_timeout(400)
        async with pg.expect_file_chooser() as fc:
            await pg.click('#a-impcli'); await pg.wait_for_timeout(300); await pg.click('#im-arq')
        await (await fc.value).set_files('/home/claude/work/arqs/pacientes.xlsx'); await pg.wait_for_timeout(1200)
        assert await pg.input_value('#im-nome')=='0' and await pg.input_value('#im-tel')=='1' and await pg.input_value('#im-nasc')=='3' and await pg.input_value('#im-cpf')=='4', [await pg.input_value(f'#im-{k}') for k in ['nome','tel','nasc','cpf']]
        tx=await pg.inner_text('.sheet'); assert '2 novos cadastros' in tx and '1 já existia' in tx, tx
        await pg.screenshot(path='/home/claude/work/imp.png',full_page=True)
        await pg.click('#im-ok'); await pg.wait_for_timeout(400)
        m=await pg.evaluate("S.clientes.find(c=>c.nome==='Maria Souza')")
        assert m['tel']=='(11) 98765-4321' and m['nasc']=='1985-03-15' and m['cpf']=='508.000.000-12' and m['email']=='maria@x.com', m
        assert await pg.evaluate("S.clientes.find(c=>c.nome==='João Lima').nasc")=='1990-12-01'
        assert await pg.evaluate("S.clientes.length")==3
        # CSV em Windows-1252 com ; e aspas
        async with pg.expect_file_chooser() as fc:
            await pg.click('#a-impcli'); await pg.wait_for_timeout(300); await pg.click('#im-arq')
        await (await fc.value).set_files('/home/claude/work/arqs/pacientes.csv'); await pg.wait_for_timeout(800)
        await pg.click('#im-ok'); await pg.wait_for_timeout(400)
        assert await pg.evaluate("S.clientes.some(c=>c.nome==='José Ação'&&c.nasc==='1970-07-05')") and await pg.evaluate("S.clientes.some(c=>c.nome==='Silva; Pedro'&&c.nasc==='1988-02-01')")
        await br.close()
    assert not er, er; print('SEM ERROS (21)')
asyncio.run(main())
