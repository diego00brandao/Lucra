import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        ctx=await br.new_context(viewport={'width':412,'height':900},device_scale_factor=2); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(700)
        await pg.click('#ob-demo'); await pg.wait_for_timeout(600); await pg.click('#b-tema')
        await pg.evaluate("UI.mod={equipe:true,estoque:true,contas:true};dobra={'servicos:Novo serviço':true,'servicos:Taxas e encargos':true,'vendas:Registrar atendimento':true,'vendas:Registrar saída':true,'agenda:Novo agendamento':true,'clientes:Novo cliente':true};ir('servicos')")
        await pg.wait_for_timeout(500)
        mis=[]
        for t in ['servicos','vendas','agenda','clientes','sim','reserva']:
            await pg.evaluate(f"ir('{t}')"); await pg.wait_for_timeout(400)
            if t=='sim': await pg.click('[data-sim-aba=orc]'); await pg.click('#o-add'); await pg.wait_for_timeout(300)
            r=await pg.evaluate("""()=>{const out=[];document.querySelectorAll('.grid2,.grid3').forEach(g=>{const fs=[...g.children].filter(e=>e.offsetParent);const rows={};
              fs.forEach(f=>{const c=f.querySelector('input,select');if(!c)return;const r=c.getBoundingClientRect();const k=Math.round(f.getBoundingClientRect().bottom);(rows[k]=rows[k]||[]).push(Math.round(r.top))});
              Object.values(rows).forEach(v=>{if(new Set(v).size>1)out.push(v.join('/'))});
              const cols=getComputedStyle(g).gridTemplateColumns.split(' ').length;const last=fs[fs.length-1];
              if(last&&fs.length%cols===1&&cols>1&&last.getBoundingClientRect().width<g.getBoundingClientRect().width-4)out.push('sozinho:'+(last.querySelector('label')||{}).textContent)});return out}""")
            if r: mis.append((t,r))
            if t in('servicos','vendas'): await pg.screenshot(path=f'shots/70-{t}.png',full_page=True)
        print('desalinhados:',mis)
        await br.close()
asyncio.run(main())
