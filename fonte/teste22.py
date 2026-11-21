"""Fotos na nuvem: dono envia, outro aparelho do profissional baixa, recepção não lê, apagar some nos dois."""
import asyncio, json, base64
from urllib.parse import urlparse
from playwright.async_api import async_playwright
import teste12 as M
ARQ={}
async def rota(route):
    r=route.request; u=urlparse(r.url)
    if u.path.startswith('/storage/v1/object'):
        h={k.lower():v for k,v in r.headers.items()}; me=M.uid_de(h)
        if not me: return await route.fulfill(status=401,body='{}')
        if r.method=='DELETE':
            for pth in json.loads(r.post_data)['prefixes']:
                cid=pth.split('/')[0]
                if M.papel(cid,me) in ('dono','profissional'): ARQ.pop(pth,None)
            return await route.fulfill(status=200,body='[]')
        pth=u.path.split('/fotos/',1)[1]; cid=pth.split('/')[0]
        if M.papel(cid,me) not in ('dono','profissional'): return await route.fulfill(status=403,body='{"message":"sem acesso"}')
        if r.method=='POST': ARQ[pth]=r.post_data_buffer; return await route.fulfill(status=200,body='{"Key":"x"}')
        if pth not in ARQ: return await route.fulfill(status=404,body='{}')
        return await route.fulfill(status=200,content_type='image/jpeg',body=ARQ[pth])
    return await M.sb_route(route)
async def aparelho(br):
    ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort()); await ctx.route(M.SB+'/**',rota)
    pg=await ctx.new_page(); pg.on('pageerror',lambda e:M.erros.append('pageerror: '+str(e)))
    await pg.goto(M.URL); await pg.wait_for_timeout(900); return ctx,pg
async def entra(pg,email,senha,criar=None):
    if criar:
        await pg.click('[data-pt=criar]'); await pg.fill('#pt-nome',criar); await pg.fill('#pt-email',email); await pg.fill('#pt-senha',senha); await pg.click('#pt-ok')
    else:
        await pg.fill('#pt-email',email); await pg.fill('#pt-senha',senha); await pg.click('#pt-ok')
    await pg.wait_for_timeout(1500)
JPG='data:image/jpeg;base64,'+base64.b64encode(open('/home/claude/work/build/foto1.jpg','rb').read()).decode()
async def main():
    srv=M.servir()
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        c1,a=await aparelho(br); await entra(a,'dono@f.com','senha123','Dono')
        await a.fill('#cc-nome','Est'); await a.click('[data-cc=estetica]'); await a.wait_for_timeout(100); await a.click('#cc-ok'); await a.wait_for_timeout(1500)
        cid=await a.evaluate("CONTA.cid")
        await a.evaluate("S.clientes.push({id:'k1',nome:'Kátia',tel:'',email:'',nasc:'',obs:''});salvar()")
        await a.evaluate(f"FOTOS.salvar({{id:'r1',clienteId:'k1',titulo:'Limpeza',data:hojeISO(),antes:'{JPG}',depois:''}})"); await a.wait_for_timeout(1500)
        await M.espera(a,"syncEst==='ok'&&!pendente()")
        assert f'{cid}/k1/r1-antes.jpg' in ARQ, list(ARQ)
        assert M.DB['clinico'][cid]['estado']['fotosIdx'][0]['tem'].get('antes'), 'índice não subiu'
        # convida profissional e recepção
        await a.evaluate(f"Promise.all([rpc('convidar',{{p_cid:'{cid}',p_email:'pro@f.com',p_papel:'profissional'}}),rpc('convidar',{{p_cid:'{cid}',p_email:'rec@f.com',p_papel:'recepcao'}})])"); await a.wait_for_timeout(500)
        c2,b=await aparelho(br); await entra(b,'pro@f.com','senha123','Pro'); await M.espera(b,"syncEst==='ok'")
        fs=await b.evaluate("FOTOS.doCliente('k1').then(rs=>rs.map(r=>[r.id,r.antes.length>100,r.depois]))")
        assert fs==[['r1',True,'']], fs
        c3,c=await aparelho(br); await entra(c,'rec@f.com','senha123','Rec'); await M.espera(c,"syncEst==='ok'")
        assert await c.evaluate("(S.fotosIdx||[]).length")==0
        st=await c.evaluate(f"garanteToken().then(()=>fetch(SB_URL+'/storage/v1/object/authenticated/fotos/{cid}/k1/r1-antes.jpg',{{headers:{{apikey:SB_KEY,Authorization:'Bearer '+SES.access_token}}}})).then(r=>r.status)")
        assert st==403, st
        # profissional adiciona o depois; dono recebe
        await b.evaluate(f"FOTOS.doCliente('k1').then(rs=>{{const r=rs[0]; r.depois='{JPG}'; return FOTOS.salvar(r)}})"); await b.wait_for_timeout(1500)
        await M.espera(b,"syncEst==='ok'&&!pendente()")
        await a.evaluate("sincronizar()"); await a.wait_for_timeout(1200)
        fa=await a.evaluate("FOTOS.doCliente('k1').then(rs=>rs.map(r=>[r.antes.length>100,r.depois.length>100]))"); assert fa==[[True,True]], fa
        # dono apaga; some no outro aparelho e no servidor
        await a.evaluate("FOTOS.apagar('r1')"); await a.wait_for_timeout(1500); await M.espera(a,"syncEst==='ok'&&!pendente()")
        assert not [k for k in ARQ if '/r1-' in k], list(ARQ)
        await b.evaluate("sincronizar()"); await b.wait_for_timeout(1200)
        assert await b.evaluate("FOTOS.doCliente('k1').then(rs=>rs.length)")==0
        await br.close()
    srv.shutdown()
    print('\n'.join(M.erros) if M.erros else 'SEM ERROS (22)')
asyncio.run(main())
