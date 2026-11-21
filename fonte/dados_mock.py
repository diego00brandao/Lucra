import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); pg=await br.new_page()
        await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(600)
        r=await pg.evaluate("""(()=>{demo();const r=resumo(mesSel);const ps=Object.values(r.porServico).sort((a,b)=>b.lucro-a.lucro);
          return JSON.stringify({mes:mesSel,bruto:r.bruto,taxa:r.taxa,custo:r.custo,desloc:r.desloc,comissao:r.comissao,imposto:r.imposto,despesas:r.despesas,compras:r.compras,lucro:r.lucro,qtd:r.qtd,ticket:r.ticket,ps:ps.map(a=>[a.nome,a.qtd,Math.round(a.bruto*100)/100,Math.round(a.lucro*100)/100])})})()""")
        print(r); await br.close()
asyncio.run(main())
