"""Agenda online e pesquisa de satisfação: a clínica publica horários livres, o paciente pede sem login,
a clínica aceita no Hoje; o paciente dá nota pelo link e ela aparece em Satisfação."""
import asyncio, json, uuid, datetime
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright
import teste12 as M
SH='/home/claude/work/shots'
VIT={}; PED=[]; PESQ=[]
def resp(route,obj,st=200): return route.fulfill(status=st,content_type='application/json',body=json.dumps(obj))
async def rota(route):
    r=route.request; u=urlparse(r.url); h={k.lower():v for k,v in r.headers.items()}; me=M.uid_de(h)
    if u.path.startswith('/rest/v1/rpc/'):
        n=u.path.rsplit('/',1)[1]; a=json.loads(r.post_data or '{}')
        if n=='ver_vitrine':
            v=next((v for v in VIT.values() if v['codigo']==a['p_codigo'] and v['ativo']),None)
            return await resp(route,None if not v else {'titulo':v['titulo'],'area':'odonto','aviso':v['aviso'],'servicos':v['servicos'],'livres':v['livres']})
        if n=='pedir_horario':
            v=next((v for v in VIT.values() if v['codigo']==a['p_codigo'] and v['ativo']),None)
            if not v: return await resp(route,{'message':'indisponivel'},400)
            if a['p_hora'] not in v['livres'].get(a['p_data'],[]): return await resp(route,{'message':'ocupado'},400)
            sv=next((s['nome'] for s in v['servicos'] if s['id']==a['p_servico']),None)
            if not sv: return await resp(route,{'message':'servico'},400)
            PED.append({'id':str(uuid.uuid4()),'clinica_id':v['cid'],'nome':a['p_nome'],'tel':a['p_tel'],'servico_id':a['p_servico'],'servico':sv,'data':a['p_data'],'hora':a['p_hora'],'obs':a['p_obs'],'status':'novo'})
            v['livres'][a['p_data']].remove(a['p_hora']); return await resp(route,'ok')
        if n=='ver_pesquisa':
            p=next((p for p in PESQ if p['token']==a['p_token']),None)
            return await resp(route,None if not p else {'clinica':'Clínica Sorriso','area':'odonto','respondida':p['respondido_em'] is not None})
        if n=='responder_pesquisa':
            p=next((p for p in PESQ if p['token']==a['p_token'] and p['respondido_em'] is None),None)
            if not p: return await resp(route,{'message':'invalida'},400)
            p.update(nota=a['p_nota'],comentario=a['p_comentario'],respondido_em=datetime.datetime.now().isoformat()); return await resp(route,'ok')
        if n in ('configurar_vitrine','atualizar_livres','responder_pedido','criar_pesquisa'):
            if not me: return await resp(route,{'message':'jwt'},401)
            cid=a.get('p_cid')
            if n=='configurar_vitrine':
                if M.papel(cid,me)!='dono': return await resp(route,{'message':'so_dono'},400)
                v=VIT.setdefault(cid,{'cid':cid,'codigo':'abc12345','livres':{}})
                v.update(ativo=a['p_ativo'],titulo=a['p_titulo'],aviso=a['p_aviso'],servicos=a['p_servicos']); return await resp(route,v['codigo'])
            if n=='atualizar_livres':
                if not M.papel(cid,me): return await resp(route,{'message':'sem_acesso'},400)
                VIT[cid]['livres']=a['p_livres']; return await resp(route,None)
            if n=='responder_pedido':
                for p in PED:
                    if p['id']==a['p_id'] and M.papel(p['clinica_id'],me): p['status']=a['p_status']
                return await resp(route,None)
            if n=='criar_pesquisa':
                if not M.papel(cid,me): return await resp(route,{'message':'sem_acesso'},400)
                t=str(uuid.uuid4()); PESQ.append({'token':t,'clinica_id':cid,'cliente_id':a['p_cliente'],'ag_id':a['p_ag'],'nota':None,'comentario':'','respondido_em':None})
                return await resp(route,t)
    if u.path in ('/rest/v1/pedidos','/rest/v1/pesquisas'):
        if not me: return await resp(route,{'message':'jwt'},401)
        q=parse_qs(u.query); cid=q['clinica_id'][0].split('.',1)[1]
        if u.path.endswith('pedidos'):
            if not M.papel(cid,me): return await resp(route,[])
            return await resp(route,[p for p in PED if p['clinica_id']==cid and p['status']=='novo'])
        if M.papel(cid,me)!='dono': return await resp(route,[])
        return await resp(route,[p for p in PESQ if p['clinica_id']==cid])
    return await M.sb_route(route)
async def aparelho(br,url=None):
    ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort()); await ctx.route(M.SB+'/**',rota)
    pg=await ctx.new_page(); pg.on('pageerror',lambda e:M.erros.append('pageerror: '+str(e)))
    await pg.goto(url or M.URL); await pg.wait_for_timeout(900); return ctx,pg
async def main():
    srv=M.servir()
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        c1,a=await aparelho(br)
        await a.click('[data-pt=criar]'); await a.fill('#pt-nome','Rafa'); await a.fill('#pt-email','rafa@f.com'); await a.fill('#pt-senha','senha123'); await a.click('#pt-ok'); await a.wait_for_timeout(1500)
        await a.fill('#cc-nome','Clínica Sorriso'); await a.click('[data-cc=odonto]'); await a.wait_for_timeout(100); await a.click('#cc-ok'); await a.wait_for_timeout(1500)
        await a.evaluate("document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';UI.zap='web';window.open=()=>({closed:false,focus(){},location:{}})")
        cid=await a.evaluate("CONTA.cid")
        await a.evaluate("S.servicos=[{id:'s1',nome:'Limpeza',preco:200,custo:20,dur:60},{id:'s2',nome:'Avaliação',preco:0,custo:0}];S.expediente={dias:[0,1,2,3,4,5,6],ini:'08:00',fim:'20:00',dur:60};salvar();ir('online')"); await a.wait_for_timeout(400)
        await a.click('#on-at'); await a.click('[data-on-s=s1]'); await a.click('[data-on-s=s2]'); await a.fill('#on-av','Rua das Flores, 120'); await a.select_option('#on-an','24')
        await a.click('#on-ok'); await a.wait_for_timeout(800)
        assert await a.evaluate("S.online.codigo")=='abc12345' and VIT[cid]['ativo'] and len(VIT[cid]['servicos'])==2
        assert 'abc12345' in await a.inner_text('.on-link')
        await a.screenshot(path=f'{SH}/agenda-online.png',full_page=True)
        await a.wait_for_timeout(3200)
        liv=VIT[cid]['livres']; ds=sorted(liv)
        hoje=await a.evaluate("hojeISO()"); assert ds and ds[0]>hoje, ds[:2]   # antecedência de 1 dia
        dia=ds[0]; assert '09:00' in liv[dia] and '20:00' not in liv[dia], liv[dia]
        # um horário marcado na agenda some da lista publicada
        await a.evaluate(f"S.agenda.push({{id:'x1',clienteId:'',servicoId:'s1',data:'{dia}',hora:'09:00',status:'marcado'}});salvar()"); await a.wait_for_timeout(3200)
        assert '09:00' not in VIT[cid]['livres'][dia], VIT[cid]['livres'][dia]
        # paciente abre o link, sem login
        c2,pc=await aparelho(br,M.URL+'&agendar=abc12345')
        assert await pc.locator('#pt-email').count()==0
        assert 'Clínica Sorriso' in await pc.inner_text('h1') and 'Rua das Flores' in await pc.inner_text('#pub')
        await pc.click('[data-p-s=s1]'); await pc.click(f'[data-p-d="{dia}"]'); await pc.click('[data-p-h="10:00"]')
        await pc.fill('#p-n','João Pedro'); await pc.fill('#p-t','11987654321'); assert await pc.input_value('#p-t')=='(11) 98765-4321'
        await pc.screenshot(path=f'{SH}/agendar-publico.png',full_page=True)
        await pc.click('#p-ok'); await pc.wait_for_timeout(600)
        assert 'Pedido enviado' in await pc.inner_text('#pub'), await pc.inner_text('#pub')
        assert len(PED)==1 and PED[0]['tel']=='11987654321' and PED[0]['servico']=='Limpeza'
        # horário que acabou de sair: tenta o mesmo e é avisado
        await pc.goto(M.URL+'&agendar=abc12345'); await pc.wait_for_timeout(800)
        assert await pc.locator(f'[data-p-d="{dia}"]').count()==1
        await pc.click(f'[data-p-d="{dia}"]'); assert await pc.locator('[data-p-h="10:00"]').count()==0
        # link desligado / inexistente
        c3,px=await aparelho(br,M.URL+'&agendar=nao-existe'); assert 'não está ativo' in await px.inner_text('#pub')
        # clínica vê no Hoje e aceita
        await a.evaluate("pedT=0;ir('hoje')"); await a.wait_for_timeout(1200)
        assert await a.locator('.aviso', has_text='pedido de horário').count()==1, await a.inner_text('#view')
        await a.click('#av-ped'); await a.wait_for_timeout(400)
        assert 'novo' in await a.inner_text('.sheet')
        na=await a.evaluate("S.agenda.length")
        await a.click('[data-pd-ok]'); await a.wait_for_timeout(800)
        assert PED[0]['status']=='aceito' and await a.evaluate("S.agenda.length")==na+1
        ag=await a.evaluate("S.agenda.slice(-1)[0]"); c=await a.evaluate(f"cli('{ag['clienteId']}')")
        assert ag['data']==dia and ag['hora']=='10:00' and ag['servicoId']=='s1' and c['nome']=='João Pedro' and c['tel']=='(11) 98765-4321', (ag,c)
        # pesquisa de satisfação foi retirada: nada no menu nem no Hoje
        await a.evaluate(f"S.agenda.push({{id:'z1',clienteId:'{ag['clienteId']}',servicoId:'s1',data:hojeISO(),hora:'08:00',status:'concluido'}});salvar();ir('hoje')"); await a.wait_for_timeout(500)
        assert await a.locator('.aviso', has_text='avaliação').count()==0 and not await a.evaluate("permitido('satisfacao')")
        assert await a.locator('#menu button[data-t=satisfacao]').count()==0
        ov=await pc.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"); assert ov<=1, ov
        await br.close()
    srv.shutdown()
    print('\n'.join(M.erros) if M.erros else 'SEM ERROS (25)')
asyncio.run(main())
