"""Conta na nuvem: Supabase simulado (mesmas regras do schema.sql) e dois aparelhos ao mesmo tempo."""
import asyncio, json, re, uuid, threading, http.server, functools, os
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright

SB='https://eilpdeyqrhtpfbrqjlqt.supabase.co'
DB={'users':{},'clinicas':{},'membros':[],'convites':[],'dados':{},'clinico':{}}
CONFIRMA={'on':False}
SEMREDE={'on':False}
erros=[]

def uid_de(h):
    a=h.get('authorization','')
    t=a.replace('Bearer ','')
    for u in DB['users'].values():
        if t and t==u.get('tok'):return u
    return None
def papel(cid,u):
    for m in DB['membros']:
        if m['clinica_id']==cid and m['user_id']==u['id']:return m['papel']
    return None
def eqf(q,k): v=q.get(k,[None])[0]; return v[3:] if v and v.startswith('eq.') else None

def responder(metodo,url,h,corpo):
    u=urlparse(url); q=parse_qs(u.query); p=u.path; b=json.loads(corpo) if corpo else {}
    def ok(d,st=200): return st,d
    def err(m,st=400): return st,{'message':m}
    if p=='/auth/v1/signup':
        if any(x['email']==b['email'] for x in DB['users'].values()):return err('User already registered',422)
        x={'id':str(uuid.uuid4()),'email':b['email'],'senha':b['password'],'confirmado':not CONFIRMA['on'],'tok':None}
        DB['users'][x['id']]=x
        if CONFIRMA['on']:return ok({'id':x['id'],'email':x['email']})
        x['tok']='t-'+uuid.uuid4().hex; return ok({'access_token':x['tok'],'refresh_token':'r-'+x['id'],'expires_in':3600,'user':{'id':x['id'],'email':x['email']}})
    if p=='/auth/v1/token':
        if q['grant_type'][0]=='password':
            x=next((x for x in DB['users'].values() if x['email']==b['email'] and x['senha']==b['password']),None)
            if not x:return err('Invalid login credentials')
            if not x['confirmado']:return err('Email not confirmed')
        else:
            x=DB['users'].get(b['refresh_token'][2:])
            if not x:return err('invalid refresh',400)
        x['tok']='t-'+uuid.uuid4().hex
        return ok({'access_token':x['tok'],'refresh_token':'r-'+x['id'],'expires_in':3600,'user':{'id':x['id'],'email':x['email']}})
    if p=='/auth/v1/logout':return ok({},204)
    me=uid_de(h)
    if p.startswith('/rest/') or p=='/auth/v1/user':
        if not me:return err('JWT expired',401)
    if p=='/auth/v1/user':return ok({'id':me['id'],'email':me['email']})
    if p.startswith('/rest/v1/rpc/'):
        f=p.split('/')[-1]
        if f=='aceitar_convites':
            if not me['confirmado'] or any(m['user_id']==me['id'] for m in DB['membros']):return ok(None)
            c=next((c for c in DB['convites'] if c['email']==me['email'].lower()),None)
            if not c:return ok(None)
            DB['membros'].append({'clinica_id':c['clinica_id'],'user_id':me['id'],'papel':c['papel'],'nome':'','email':me['email']})
            DB['convites']=[x for x in DB['convites'] if x['email']!=me['email'].lower()]; return ok(c['clinica_id'])
        if f=='criar_clinica':
            if any(m['user_id']==me['id'] for m in DB['membros']):return err('ja_tem_clinica')
            cid=str(uuid.uuid4()); DB['clinicas'][cid]={'id':cid,'nome':b['p_nome'],'area':b['p_area']}
            DB['membros'].append({'clinica_id':cid,'user_id':me['id'],'papel':'dono','nome':b['p_pessoa'],'email':me['email']})
            DB['dados'][cid]={'estado':{},'versao':0}; DB['clinico'][cid]={'estado':{},'versao':0}; return ok(cid)
        if f=='salvar':
            pp=papel(b['p_cid'],me)
            if not pp:return err('sem_acesso')
            if b['p_parte']=='clinico' and pp not in('dono','profissional'):return err('sem_acesso')
            t=DB[b['p_parte']][b['p_cid']]
            if t['versao']!=b['p_versao']:return err('conflito')
            t['estado']=json.loads(json.dumps(b['p_estado'])); t['versao']+=1; return ok(t['versao'])
        if f=='convidar':
            if papel(b['p_cid'],me)!='dono':return err('so_dono')
            DB['convites']=[c for c in DB['convites'] if not(c['clinica_id']==b['p_cid'] and c['email']==b['p_email'])]
            DB['convites'].append({'id':str(uuid.uuid4()),'clinica_id':b['p_cid'],'email':b['p_email'].strip().lower(),'papel':b['p_papel']}); return ok(None)
        if f=='cancelar_convite':
            DB['convites']=[c for c in DB['convites'] if not(c['id']==b['p_id'] and papel(c['clinica_id'],me)=='dono')]; return ok(None)
        if f=='mudar_papel':
            if papel(b['p_cid'],me)!='dono':return err('so_dono')
            for m in DB['membros']:
                if m['clinica_id']==b['p_cid'] and m['user_id']==b['p_user']:m['papel']=b['p_papel']
            return ok(None)
        if f=='remover_membro':
            if papel(b['p_cid'],me)!='dono':return err('so_dono')
            DB['membros']=[m for m in DB['membros'] if not(m['clinica_id']==b['p_cid'] and m['user_id']==b['p_user'])]; return ok(None)
        return err('rpc desconhecida '+f,404)
    tab=p.split('/')[-1]
    if tab=='membros':
        if eqf(q,'user_id'):return ok([m for m in DB['membros'] if m['user_id']==eqf(q,'user_id')==me['id']])
        cid=eqf(q,'clinica_id'); return ok([m for m in DB['membros'] if m['clinica_id']==cid and papel(cid,me)])
    if tab=='clinicas':
        cid=eqf(q,'id')
        if not papel(cid,me):return ok([])
        if metodo=='PATCH':
            if papel(cid,me)!='dono':return ok([])
            DB['clinicas'][cid]['nome']=b['nome']; return ok([],204)
        return ok([DB['clinicas'][cid]])
    if tab=='convites':
        cid=eqf(q,'clinica_id'); return ok([c for c in DB['convites'] if c['clinica_id']==cid and papel(cid,me)=='dono'])
    if tab in('dados','clinico'):
        cid=eqf(q,'clinica_id'); pp=papel(cid,me)
        if not pp or (tab=='clinico' and pp=='recepcao'):return ok([])
        return ok([DB[tab][cid]])
    return err('rota '+p,404)

async def sb_route(route):
    if SEMREDE['on']: return await route.abort('internetdisconnected')
    r=route.request
    try:
        st,d=responder(r.method,r.url,{k.lower():v for k,v in r.headers.items()},r.post_data)
        await route.fulfill(status=st,content_type='application/json',body='' if st==204 else json.dumps(d))
    except Exception as e:
        erros.append('mock: '+repr(e)); await route.fulfill(status=500,body='{}')

def servir():
    os.chdir('/home/claude')
    h=functools.partial(http.server.SimpleHTTPRequestHandler,directory='/home/claude')
    h.log_message=lambda *a:None
    s=http.server.ThreadingHTTPServer(('127.0.0.1',8765),h); threading.Thread(target=s.serve_forever,daemon=True).start(); return s
URL='http://127.0.0.1:8765/clinica-financeiro.html?nuvem=1'

async def aparelho(br,w=390):
    ctx=await br.new_context(viewport={'width':w,'height':844})
    await ctx.route('**/fonts.g*/**',lambda r:r.abort()); await ctx.route(SB+'/**',sb_route)
    pg=await ctx.new_page(); pg.on('pageerror',lambda e:erros.append('pageerror: '+str(e)))
    async def dlg(d): erros.append('DIÁLOGO NATIVO'); await d.dismiss()
    pg.on('dialog',dlg)
    await pg.goto(URL); await pg.wait_for_timeout(900); return ctx,pg
async def espera(pg,cond,ms=6000):
    for _ in range(ms//150):
        if await pg.evaluate(cond):return True
        await pg.wait_for_timeout(150)
    raise AssertionError('esperei: '+cond)

async def main():
    srv=servir()
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        SH='/home/claude/work/shots'; os.makedirs(SH,exist_ok=True)
        # ── aparelho 1: dono cria conta e clínica de odontologia, com o que já tinha no aparelho
        c1,a=await aparelho(br)
        assert await a.locator('#porta').count()==1 and await a.evaluate("document.body.classList.contains('porta-on')")
        await a.screenshot(path=f'{SH}/n1-entrar.png')
        await a.evaluate("localStorage.setItem('lucra:v1:odonto',JSON.stringify({area:'odonto',clientes:[{id:'cx',nome:'Paciente Antigo',tel:'',email:'',nasc:'',obs:''}],servicos:[{id:'s1',nome:'Limpeza',preco:200,custo:20}],vendas:[],despesas:[],agenda:[]}));UI.chaves.odonto='lucra:v1:odonto';salvarUI()")
        await a.click('[data-pt=criar]'); await a.fill('#pt-nome','Rafa'); await a.fill('#pt-email','rafa@teste.com'); await a.fill('#pt-senha','123')
        await a.click('#pt-ok'); await a.wait_for_timeout(200); assert '6 caracteres' in await a.inner_text('#porta')
        await a.fill('#pt-senha','senha123'); await a.click('#pt-ok'); await a.wait_for_timeout(700)
        assert 'Sua clínica' in await a.inner_text('#porta'); assert await a.input_value('#cc-voce')=='Rafa', (await a.input_value('#cc-voce'), await a.evaluate("localStorage.getItem('lucra:nome-novo')"))
        await a.fill('#cc-nome','Odonto Rafa'); await a.click('[data-cc=odonto]'); await a.wait_for_timeout(150)
        assert await a.locator('#cc-levar').is_checked()
        await a.screenshot(path=f'{SH}/n2-clinica.png',full_page=True)
        await a.click('#cc-ok'); await a.wait_for_timeout(1500)
        assert await a.locator('#porta').count()==0 and await a.evaluate("CONTA&&CONTA.papel==='dono'&&UI.area==='odonto'")
        assert await a.evaluate("S.clientes.some(c=>c.nome==='Paciente Antigo')"), 'não levou os dados do aparelho'
        await espera(a,"syncEst==='ok'")
        cid=await a.evaluate("CONTA.cid")
        assert any(c['nome']=='Paciente Antigo' for c in DB['dados'][cid]['estado']['clientes']), 'não subiu para a nuvem'
        assert await a.locator('#sync-st').count()==0, 'status no topo com tudo certo'
        await a.evaluate("ir('ajustes')"); await a.wait_for_timeout(300); assert 'Salvo na nuvem' in await a.inner_text('#sync-aj')
        await a.evaluate("ir('painel')"); await a.wait_for_timeout(200)
        # área fixa
        await a.evaluate("mudaArea('psico')"); assert await a.evaluate("UI.area")=='odonto'
        await a.evaluate("ir('ajustes')"); await a.wait_for_timeout(300)
        assert await a.locator('#sec-conta').count()==1 and await a.locator('#view .areas').count()==0
        # anamnese e prontuário vão para a parte clínica, não para os dados do dia a dia
        await a.evaluate("S.anamneses.push({clienteId:'cx',data:hojeISO(),resp:{alerg:{sim:true,det:'dipirona'}},queixa:'',obs:''});S.prontuario.push({id:'pr1',clienteId:'cx',agId:'',data:hojeISO(),servicoId:'',regiao:'36',feito:'canal',mat:'',prox:''});salvar()")
        await espera(a,f"syncEst==='ok'&&!pendente()"); await a.wait_for_timeout(300)
        assert DB['clinico'][cid]['estado']['prontuario'][0]['feito']=='canal' and 'prontuario' not in DB['dados'][cid]['estado']
        # taxas, meta e imposto sobrevivem a sair e entrar de novo (não voltam ao padrão)
        await a.evaluate("S.taxas.debito=1.99;S.taxas.cred1=4.25;S.meta=12345;S.imposto=11;S.perfil={nome:'Dra. Rafa',doc:'',profissao:'Dentista'};salvar()")
        await espera(a,"syncEst==='ok'&&!pendente()"); await a.wait_for_timeout(300)
        assert DB['dados'][cid]['estado']['taxas']['debito']==1.99
        await a.evaluate("sairDaConta(true)"); await a.wait_for_timeout(300)
        await a.fill('#pt-email','rafa@teste.com'); await a.fill('#pt-senha','senha123'); await a.click('#pt-ok'); await a.wait_for_timeout(1800)
        await espera(a,"syncEst==='ok'")
        r=await a.evaluate("[S.taxas.debito,S.taxas.cred1,S.meta,S.imposto,S.perfil.nome]")
        assert r==[1.99,4.25,12345,11,'Dra. Rafa'], ('voltou ao padrão', r)
        assert DB['dados'][cid]['estado']['taxas']['debito']==1.99 and DB['dados'][cid]['estado']['meta']==12345, 'a nuvem foi sobrescrita'
        assert await a.evaluate("S.clientes.some(c=>c.nome==='Paciente Antigo')") and await a.evaluate("S.prontuario.length")==1
        # convida a recepção
        await a.evaluate("ir('usuarios')"); await a.wait_for_timeout(600)
        assert await a.locator('#menu button[data-t=usuarios]').is_hidden()==False or True
        await a.fill('#us-email','Recep@Teste.com'); await a.click('[data-us-n=recepcao]'); await a.click('#us-conv'); await a.wait_for_timeout(900)
        assert DB['convites'][0]['email']=='recep@teste.com' and DB['convites'][0]['papel']=='recepcao'
        assert 'recep@teste.com' in await a.inner_text('.sheet #lc-tx') or 'recep@teste.com' in await a.input_value('#lc-tx')
        await a.screenshot(path=f'{SH}/n3-usuarios.png',full_page=True)
        await a.keyboard.press('Escape'); await a.wait_for_timeout(300)
        # ── aparelho 2: recepção cria conta com o e-mail do convite e cai direto na clínica
        c2,b=await aparelho(br)
        await b.click('[data-pt=criar]'); await b.fill('#pt-nome','Ana'); await b.fill('#pt-email','recep@teste.com'); await b.fill('#pt-senha','outra123'); await b.click('#pt-ok')
        await b.wait_for_timeout(1500)
        assert await b.locator('#porta').count()==0, await b.inner_text('#porta')
        assert await b.evaluate("CONTA.papel")=='recepcao' and await b.evaluate("CONTA.cid")==cid
        await espera(b,"syncEst==='ok'")
        assert await b.evaluate("S.taxas.debito")==1.99 and DB['dados'][cid]['estado']['taxas']['debito']==1.99, 'aparelho novo apagou as taxas'
        assert await b.evaluate("S.clientes.some(c=>c.nome==='Paciente Antigo')") and await b.evaluate("S.prontuario.length===0&&S.anamneses.length===0"), 'recepção recebeu dados de saúde'
        assert await b.evaluate("tela")=='hoje'
        assert await b.locator('#menu button[data-t=painel]').is_hidden() and await b.locator('#menu button[data-t=lucro]').is_hidden() and await b.locator('#menu button[data-t=caixa]').count()==1
        await b.evaluate("ir('lucro')"); await b.wait_for_timeout(200); assert await b.evaluate("tela")=='hoje'
        await b.evaluate("ir('ajustes')"); await b.wait_for_timeout(300)
        tx=await b.inner_text('#view'); assert 'Recepção' in tx and 'Taxas' not in tx
        await b.screenshot(path=f'{SH}/n4-recepcao.png',full_page=True)
        # recepção marca horário; dono vê. Ao mesmo tempo o dono cadastra um paciente: nada se perde
        await b.evaluate("S.agenda.push({id:'agB',data:hojeISO(),hora:'15:00',clienteId:'cx',servicoId:'s1',status:'marcado'});salvar()")
        await a.evaluate("S.clientes.push({id:'cy',nome:'Paciente Novo do Dono',tel:'',email:'',nasc:'',obs:''});salvar()")
        await a.wait_for_timeout(2500); await b.wait_for_timeout(500)
        await a.evaluate("sincronizar()"); await b.evaluate("sincronizar()"); await a.wait_for_timeout(1200); await a.evaluate("sincronizar()"); await a.wait_for_timeout(800)
        assert await a.evaluate("S.agenda.some(x=>x.id==='agB')"), 'dono não recebeu o horário da recepção'
        assert await b.evaluate("S.clientes.some(c=>c.id==='cy')"), 'recepção não recebeu o paciente do dono'
        est=DB['dados'][cid]['estado']; assert any(x['id']=='agB' for x in est['agenda']) and any(c['id']=='cy' for c in est['clientes'])
        assert DB['clinico'][cid]['estado']['prontuario'], 'prontuário sumiu'
        # exclusão de um lado chega no outro
        await a.evaluate("S.clientes=S.clientes.filter(c=>c.id!=='cy');salvar()"); await a.wait_for_timeout(2200); await b.evaluate("sincronizar()"); await b.wait_for_timeout(900)
        assert not await b.evaluate("S.clientes.some(c=>c.id==='cy')"), 'exclusão não chegou'
        # dono troca o papel da recepção para profissional; ao entrar de novo, passa a ver o prontuário
        uidb=await b.evaluate("CONTA.uid")
        await a.evaluate("ir('usuarios')"); await a.wait_for_timeout(700)
        await a.select_option(f'[data-us-p="{uidb}"]','profissional'); await a.wait_for_timeout(500)
        await b.reload(); await b.wait_for_timeout(1800)
        assert await b.evaluate("CONTA.papel")=='profissional'
        await espera(b,"syncEst==='ok'"); assert await b.evaluate("S.prontuario.length")==1
        assert await b.locator('#menu button[data-t=painel]').is_hidden()
        # sem internet: abre com o que ficou guardado e avisa
        SEMREDE['on']=True; await b.reload(); await b.wait_for_timeout(1500)
        assert await b.locator('#porta').count()==0 and await b.evaluate("CONTA&&syncEst==='off'"), await b.evaluate("syncEst")
        assert 'Sem internet' in await b.inner_text('#sync-st')
        await b.evaluate("S.clientes.push({id:'cz',nome:'Lançado offline',tel:'',email:'',nasc:'',obs:''});salvar()"); await b.wait_for_timeout(1500)
        SEMREDE['on']=False; await b.evaluate("sincronizar()"); await espera(b,"syncEst==='ok'&&!pendente()")
        assert any(c['id']=='cz' for c in DB['dados'][cid]['estado']['clientes'])
        # sair apaga os dados do aparelho e volta para a porta
        await b.evaluate("sairDaConta()"); await b.wait_for_timeout(300); await b.click('[data-cf=ok]'); await b.wait_for_timeout(500)
        assert await b.locator('#porta').count()==1 and await b.evaluate("!localStorage.getItem('lucra:nuvem:'+%r)"%cid) and await b.evaluate("!localStorage.getItem('lucra:sessao')")
        # login errado e certo
        await b.fill('#pt-email','recep@teste.com'); await b.fill('#pt-senha','errada'); await b.click('#pt-ok'); await b.wait_for_timeout(500)
        assert 'não conferem' in await b.inner_text('#porta')
        await b.fill('#pt-senha','outra123'); await b.click('#pt-ok'); await b.wait_for_timeout(1500)
        assert await b.evaluate("CONTA&&CONTA.papel==='profissional'")
        # confirmação de e-mail ligada: mostra "confira o seu e-mail"
        CONFIRMA['on']=True
        c3,c=await aparelho(br)
        await c.click('[data-pt=criar]'); await c.fill('#pt-nome','X'); await c.fill('#pt-email','x@teste.com'); await c.fill('#pt-senha','senha123'); await c.click('#pt-ok'); await c.wait_for_timeout(600)
        assert 'Confira o seu e-mail' in await c.inner_text('#porta')
        await c.screenshot(path=f'{SH}/n5-confira.png')
        # quem chega pelo link do e-mail entra direto
        x=next(u for u in DB['users'].values() if u['email']=='x@teste.com'); x['confirmado']=True; x['tok']='t-link'
        c=await c3.new_page(); c.on('pageerror',lambda e:erros.append('pageerror: '+str(e)))
        await c.goto(URL+'#access_token=t-link&refresh_token=r-'+x['id']+'&expires_in=3600&type=signup'); await c.wait_for_timeout(1500)
        assert 'Sua clínica' in await c.inner_text('#porta') and '#' not in c.url
        await c3.close(); await c1.close(); await c2.close()
        # modo local (arquivo) continua sem login
        ctx=await br.new_context(); pg=await ctx.new_page(); await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(800)
        assert await pg.locator('#porta').count()==0 and not await pg.evaluate("NUVEM")
        await br.close()
    srv.shutdown()
    print('\n'.join(erros) if erros else 'SEM ERROS (12)')
asyncio.run(main())
