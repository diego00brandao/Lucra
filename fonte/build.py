import re, sys, os
D = os.path.dirname(os.path.abspath(__file__))
SRC = '/mnt/user-data/uploads/clinica-financeiro__1_.html'
OUT = '/home/claude/clinica-financeiro.html'
src = open(SRC, encoding='utf-8').read()
rd = lambda n: open(os.path.join(D, n), encoding='utf-8').read()

js = src[src.index('<script>') + 8: src.rindex('</script>')]

def rep(old, new, n=1):
    global js
    c = js.count(old)
    assert c == n, f'esperava {n}, achei {c}: {old[:70]!r}'
    js = js.replace(old, new)

def rep_ws(old, new, n=1):
    """casa ignorando diferenças de espaço/quebra de linha"""
    global js
    pat = r'\s+'.join(re.escape(p) for p in old.split())
    c = len(re.findall(pat, js))
    assert c == n, f'esperava {n}, achei {c}: {old[:70]!r}'
    js = re.sub(pat, lambda m: new, js)

def troca_bloco(ini, fim, novo):
    global js
    a, b = js.index(ini), js.index(fim)
    assert a < b
    js = js[:a] + novo + js[b:]

# ── estado de interface (fora do modelo de dados) ──
rep("const CHAVE='lucra:v1';", """const CHAVE='lucra:v1';
/* preferências de interface ficam em outra chave: o modelo de dados de 'lucra:v1' não muda */
const CHAVE_UI='lucra:ui';
let UI={clinica:'',boasVindas:false};
function carregarUI(){ try{const r=JSON.parse(localStorage.getItem(CHAVE_UI)||'null'); if(r&&typeof r==='object'){UI.clinica=String(r.clinica||'');UI.boasVindas=!!r.boasVindas}}catch(e){} }
function salvarUI(){ try{localStorage.setItem(CHAVE_UI,JSON.stringify(UI))}catch(e){} }""")

# ── folha deslizante + confirmar + ícones ──
troca_bloco('/* folha deslizante: substitui prompt do navegador */', 'const serv=id=>', rd('sheet.js'))

# ── roteador ──
js, n = re.subn(r"function ir\(t\)\{.*\n", lambda m: """function ir(t){ const mudou=t!==tela; tela=t; edit={t:'',id:''}; document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.t===t))); render(); if(mudou)animar(); window.scrollTo(0,0) }
/* transição entre telas: a classe sai depois, para buscas e edições não reanimarem a lista */
let tAnima=0;
function animar(){ const el=$('#view'); el.classList.remove('entra'); void el.offsetWidth; el.classList.add('entra');
  clearTimeout(tAnima); tAnima=setTimeout(()=>el.classList.remove('entra'),800) }
/* liga cada rótulo ao seu campo, para leitor de tela e toque no rótulo */
function ligarRotulos(raiz){ raiz.querySelectorAll('.field').forEach(f=>{ const l=f.querySelector('label'), c=f.querySelector('input,select');
  if(l&&c&&c.id&&!l.htmlFor)l.htmlFor=c.id }) }
""", js); assert n == 1
js, n = re.subn(r"function render\(\)\{.*\n", lambda m: "function render(){ const el=$('#view'); el.innerHTML=''; (T[tela]||T.painel)(el); ligarRotulos(el) }\n", js); assert n == 1
rep("S.tema==='escuro'?'#0E1016':'#F6F7FB'", "S.tema==='escuro'?'#171014':'#FAF6F1'")

# ── painel, ajustes + boas-vindas, início ──
troca_bloco('/* ══════════ PAINEL ══════════ */', '/* ══════════ MOVIMENTO (vendas + despesas) ══════════ */', rd('painel.js'))
fim = rd('fim.js').rstrip()
assert fim.endswith('/* ── exemplo ── */'); fim = fim[:-len('/* ── exemplo ── */')]
troca_bloco('/* ══════════ AJUSTES ══════════ */', '/* ── exemplo ── */', fim)
a = js.index('/* ── início ── */')
js = js[:a] + """/* ── início ── */
const ESQUELETO=$('#view').innerHTML;
function marca(){ const e=$('#clinica-nome'); if(e)e.textContent=UI.clinica||'financeiro da clínica';
  document.title=(UI.clinica?UI.clinica+' · ':'')+'Lucra · Financeiro para clínicas' }
carregar(); carregarUI(); tema(); marca();
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>ir(b.dataset.t));
$('#b-tema').onclick=()=>{S.tema=S.tema==='escuro'?'claro':'escuro';tema();salvar()};
$('#b-cfg').onclick=()=>ir('ajustes');
/* o esqueleto fica na tela só enquanto as fontes chegam (no máximo 0,6 s) */
const iniciar=()=>{ render(); animar();
  if(!UI.boasVindas&&!S.servicos.length&&!S.vendas.length&&!S.clientes.length)boasVindas() };
((document.fonts&&document.fonts.ready)
  ?Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,600))]):Promise.resolve()).then(iniciar,iniciar);
"""

# abrirSheet: rótulos também dentro das folhas
rep("  if(aoAbrir)aoAbrir(fechar);\n  if(!bg.contains", "  ligarRotulos(bg);\n  if(aoAbrir)aoAbrir(fechar);\n  if(!bg.contains")

# ── confirm() → folha deslizante ──
rep_ws("""if(!confirm('Desfazer o estorno e voltar a contar este atendimento normalmente?'))return;
    delete v.estorno; salvar(); toast('Estorno desfeito'); render();
  });""", """confirmar('Desfazer o estorno?','Este atendimento volta a contar normalmente nos números do mês.','Desfazer estorno',
      ()=>{ delete v.estorno; salvar(); toast('Estorno desfeito'); render() });
  });""")
rep_ws("""if(!confirm('Excluir este atendimento?'))return;
    S.vendas=S.vendas.filter(v=>v.id!==b.dataset.delV); salvar(); render(); toast('Excluído')});""",
"""const id=b.dataset.delV;
    confirmar('Excluir este atendimento?','Ele sai do caixa e dos números do mês. Não dá para desfazer.','Excluir',
      ()=>{ S.vendas=S.vendas.filter(v=>v.id!==id); salvar(); render(); toast('Excluído') },true)});""")
rep_ws("""if(!confirm('Excluir esta saída?'))return;
    S.despesas=S.despesas.filter(d=>d.id!==b.dataset.delD); salvar(); render(); toast('Excluída')});""",
"""const id=b.dataset.delD;
    confirmar('Excluir esta saída?','Ela deixa de ser descontada da sobra do mês. Não dá para desfazer.','Excluir',
      ()=>{ S.despesas=S.despesas.filter(d=>d.id!==id); salvar(); render(); toast('Excluída') },true)});""")
rep_ws("""if(!confirm(usado?'Esse serviço já tem atendimentos registrados. Excluir mesmo assim? O histórico continua, mas sem o nome.':'Excluir este serviço?'))return;
    S.servicos=S.servicos.filter(s=>s.id!==id); salvar(); render(); toast('Serviço excluído')});""",
"""confirmar('Excluir este serviço?',usado?'Esse serviço já tem atendimentos registrados. O histórico continua, mas sem o nome do procedimento.':'Ele sai da lista de serviços. Não dá para desfazer.','Excluir',
      ()=>{ S.servicos=S.servicos.filter(s=>s.id!==id); salvar(); render(); toast('Serviço excluído') },true)});""")
rep_ws("""if(acao==='excluir'){ if(!confirm('Excluir este agendamento?'))return;
      S.agenda=S.agenda.filter(z=>z.id!==a.id); salvar(); render(); return toast('Excluído') }""",
"""if(acao==='excluir')return confirmar('Excluir este agendamento?','O horário some da agenda. Não dá para desfazer.','Excluir',
      ()=>{ S.agenda=S.agenda.filter(z=>z.id!==a.id); salvar(); render(); toast('Excluído') },true);""")
rep_ws("""if(!confirm(usado?'Esse cliente tem atendimentos registrados. Excluir mesmo assim? O histórico financeiro continua.':'Excluir este cliente?'))return;
    S.clientes=S.clientes.filter(c=>c.id!==id);
    S.agenda=S.agenda.filter(a=>!(a.clienteId===id&&a.status==='marcado'));
    salvar(); render(); toast('Cliente excluído')});""",
"""confirmar('Excluir este cliente?',usado?'Esse cliente tem atendimentos registrados. O histórico financeiro continua, e os horários marcados dele saem da agenda.':'O cadastro e os horários marcados dele saem do sistema. Não dá para desfazer.','Excluir',()=>{
    S.clientes=S.clientes.filter(c=>c.id!==id);
    S.agenda=S.agenda.filter(a=>!(a.clienteId===id&&a.status==='marcado'));
    salvar(); render(); toast('Cliente excluído')},true)});""")
rep_ws("""if(!confirm('Desfazer o estorno e voltar a contar este atendimento normalmente?'))return;
      delete v.estorno; salvar(); toast('Estorno desfeito'); fechar(); setTimeout(()=>historico(id),240) });""",
"""confirmar('Desfazer o estorno?','Este atendimento volta a contar normalmente nos números do mês.','Desfazer estorno',
        ()=>{ delete v.estorno; salvar(); toast('Estorno desfeito'); fechar(); render(); setTimeout(()=>historico(id),320) }) });""")
for ruim in (r'\bconfirm\(', r'\balert\(', r'\bprompt\('):
    assert not re.search(ruim, js), ruim

# ── ícones nos botões ──
js, n = re.subn(r'(id="[fdsac]-add" style="flex:1">)\$\{(\w+)\?', lambda m: m.group(1) + "${ic(" + m.group(2) + "?'check':'plus')}${" + m.group(2) + "?", js); assert n == 5, n
rep('>Editar</button>', ">${ic('edit',16)}Editar</button>", 6)
rep('>×</button>', " aria-label=\"Excluir\">${ic('trash',18)}</button>", 6)
rep('>Usar sessão</button>', ">${ic('check',16)}Usar sessão</button>", 1)
rep('data-acao="concluir">Atendeu</button>', "data-acao=\"concluir\">${ic('check',16)}Atendeu</button>")
rep('>Histórico</button>', ">${ic('clock',16)}Histórico</button>")
rep('>WhatsApp</a>', ">${ic('chat',16)}WhatsApp</a>")
rep('>Chamar no WhatsApp</a>', ">${ic('chat',16)}Chamar no WhatsApp</a>")
rep('aria-label="Dia anterior">←</button>', "aria-label=\"Dia anterior\" style=\"padding:0;width:48px;flex:none\">${ic('left')}</button>")
rep('aria-label="Próximo dia">→</button>', "aria-label=\"Próximo dia\" style=\"padding:0;width:48px;flex:none\">${ic('right')}</button>")
rep('>Estornar</button>', ">${ic('undo',16)}Estornar</button>")
rep('id="t-save" style="margin-top:12px">Salvar', "id=\"t-save\" style=\"margin-top:12px\">${ic('check')}Salvar")
rep('id="e-ok" style="flex:1">Confirmar estorno', "id=\"e-ok\" style=\"flex:1\">${ic('undo')}Confirmar estorno")
rep('id="k-ok" style="flex:1">Confirmar e lançar no caixa', "id=\"k-ok\" style=\"flex:1\">${ic('check')}Confirmar e lançar no caixa")
rep('<button class="btn pri" id="ir-serv" style="margin-top:16px">Ir para Serviços</button>', "<button class=\"btn pri\" id=\"ir-serv\">${ic('arrow')}Ir para Serviços</button>")

# ── textos: nome da tela e estados vazios que ensinam ──
rep('<h1>Movimento</h1>', '<h1>Caixa</h1>')
rep('<p>Sem serviço cadastrado não dá para registrar atendimento.</p>', '<p>O Lucra calcula a sobra a partir do preço e do custo de produto de cada serviço. Cadastre o primeiro e volte aqui para lançar o atendimento.</p>')
rep("'Registre o primeiro acima.'", "'Preencha o formulário acima a cada cliente atendido. Na hora você já vê quanto sobra depois da maquininha e do produto.'")
rep("'Aluguel, luz, compra de produto, tudo entra aqui.'", "'Lance aluguel, luz, internet e compras de produto. Sem as saídas, a sobra do mês parece maior do que é.'")
rep('<p>Cadastre o primeiro acima, ou carregue o exemplo no Painel.</p>', '<p>Comece pelo procedimento que você mais faz: nome, preço e quanto gasta de produto em cada atendimento.</p>')
rep('<p>O simulador usa o custo de produto para calcular o lucro.</p></div></div>`;\n    el.innerHTML=x; return;',
    "<p>Com um serviço cadastrado, você compara Pix, débito e crédito parcelado e vê quanto cada forma de pagamento tira do seu lucro.</p>\n      <button class=\"btn pri\" id=\"ir-serv\">${ic('arrow')}Ir para Serviços</button></div></div>`;\n    el.innerHTML=x; $('#ir-serv').onclick=()=>ir('servicos'); return;")
rep('<p>As reservas aparecem conforme você registra atendimentos.</p>', '<p>Cada atendimento registrado consome produto. Aqui aparece quanto separar para repor antes de fazer a sua retirada.</p>')
rep('<p>A agenda usa os serviços para calcular valor e retorno.</p></div></div>`;\n    el.innerHTML=x; return;',
    "<p>A agenda usa os serviços para sugerir o valor e avisar quando o cliente deve voltar.</p>\n      <button class=\"btn pri\" id=\"ir-serv\">${ic('arrow')}Ir para Serviços</button></div></div>`;\n    el.innerHTML=x; $('#ir-serv').onclick=()=>ir('servicos'); return;")
rep('<p>Use as setas para ver outro dia ou agende acima.</p>', '<p>Dia livre. Use as setas para ver outro dia ou marque um horário no formulário acima.</p>')
rep("'Quando um cliente passar do intervalo de retorno do procedimento, ele aparece aqui.'", "'Quando um cliente passar do intervalo de retorno do procedimento, ele aparece aqui com o botão do WhatsApp. O intervalo é o campo “Retorno em (dias)” de cada serviço.'")
rep("'Cadastre o primeiro acima. Depois dá para ligar cada atendimento a ele.'", "'Cadastre o primeiro acima. Ligando cada atendimento ao cliente, você descobre quem mais traz lucro e quem já está na hora de voltar.'")
rep("LUCRA — financeiro para clínicas de estética · versão 1", "LUCRA — financeiro para clínicas de estética · versão 1 (visual 2)")

exec(rd('patches2.py'))
exec(rd('patches3.py'))
exec(rd('patches4.py'))
exec(rd('patches5.py'))
exec(rd('patches6.py'))
exec(rd('patches7.py'))
exec(rd('patches8.py'))
exec(rd('patches9.py'))
exec(rd('patches10.py'))
exec(rd('patches11.py'))
exec(rd('patches12.py'))
exec(rd('patches13.py'))
exec(rd('patches14.py'))
exec(rd('patches15.py'))
exec(rd('patches16.py'))
exec(rd('patches17.py'))

# ── monta o arquivo ──
body = rd('body.html')
limpa = lambda s: re.sub(r'(\d)\.0+(?=[^\d.])', r'\1', re.sub(r'(\.\d*?[1-9])0+(?=[^\d])', r'\1', s))
body = re.sub(r'<svg.*?</svg>', lambda m: limpa(m.group(0)), body, flags=re.S)
i0, i1 = js.index('const IC={'), js.index('const brlG=')
js = js[:i0] + limpa(js[i0:i1]) + js[i1:]
fav = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='10' fill='%237A2E4D'/%3E%3Cpath d='M11 8.5V20a3 3 0 0 0 3 3h7.5' fill='none' stroke='%23FFF6EE' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M15.5 17.5c0-5 3-8.5 8.5-9 0 5.5-3 9-8.5 9Z' fill='%23E0B36A'/%3E%3C/svg%3E"
head = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FAF6F1">
<title>Lucra · Financeiro para clínicas</title>
<link rel="icon" href="{fav}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
{rd('style.css')}</style>
</head>
'''
open(OUT, 'w', encoding='utf-8').write(head + body + '\n<script>' + js + '</script>\n</body>\n</html>\n')

# ── garantia: as funções de cálculo são idênticas às do original ──
orig = src[src.index('<script>') + 8: src.rindex('</script>')]
def fn(code, nome):
    m = re.search(r'^function ' + nome + r'\(.*?^\}', code, re.S | re.M)
    return m.group(0)
for nome in ['conta', 'retornos', 'usarSessao', 'taxaDe', 'pacotesAbertos']:
    assert fn(orig, nome) == fn(js, nome), nome
    print('idêntica:', nome)
print('ok', len(head + body + js), 'bytes')

# ── versão instalável: mesma página + manifesto, service worker e ícones ──
import hashlib, json, shutil
PWA = '/home/claude/lucra-app'
os.makedirs(PWA, exist_ok=True)
pagina = open(OUT, encoding='utf-8').read()
extra = '''<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Lucra">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="description" content="Financeiro para clínicas de estética: o lucro real de cada procedimento.">
'''
assert pagina.count('<link rel="preconnect" href="https://fonts.googleapis.com">') == 1
pagina = pagina.replace('<link rel="preconnect" href="https://fonts.googleapis.com">', extra + '<link rel="preconnect" href="https://fonts.googleapis.com">')
open(PWA + '/index.html', 'w', encoding='utf-8').write(pagina)
json.dump({
  "name": "Lucra · Financeiro para clínicas", "short_name": "Lucra", "lang": "pt-BR", "dir": "ltr",
  "description": "O lucro real de cada procedimento, depois de maquininha, produto, comissão e imposto.",
  "id": "./", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait-primary",
  "background_color": "#FAF6F1", "theme_color": "#FAF6F1", "categories": ["business", "finance", "productivity"],
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
  "shortcuts": [{"name": "Agenda", "url": "./#agenda"}, {"name": "Registrar atendimento", "url": "./#registrar"}]
}, open(PWA + '/manifest.webmanifest', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
h = hashlib.sha1(pagina.encode()).hexdigest()[:10]
open(PWA + '/sw.js', 'w', encoding='utf-8').write(rd('sw.js').replace('__HASH__', h))
print('pwa', h)
