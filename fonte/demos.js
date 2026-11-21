/* ══════════ EXEMPLOS POR ÁREA ══════════
   Pacientes fictícios; o telefone de exemplo é o mesmo do exemplo de estética. */
const TEL_DEMO='(11) 98098-4102';
function demoArea(){ const a=area(); if(a==='psico')demoPsico(); else if(a==='odonto')demoOdonto(); else demo(); S.area=a; salvar() }
function demoBase(a){ const t=S.tema; S=JSON.parse(JSON.stringify(PAD)); S.tema=t; S.area=a; S.imposto=6 }
function rndDemo(seed){ return n=>{ seed=(seed*1103515245+12345)%2147483648; return Math.floor(seed/2147483648*n) } }

function demoPsico(){
  demoBase('psico'); S.meta=14000; S.falta={cobrar:true,horas:24};
  const sv=[['Sessão individual (50 min)',180,14],['Sessão online (50 min)',160,14],['Terapia de casal (60 min)',260,14],['Avaliação inicial',220,0]]
    .map(([nome,preco,retorno])=>({id:uid(),nome,preco,precoMax:0,custo:0,comissao:0,retorno}));
  S.servicos=sv;
  const nomes=['Ana Ribeiro','Bruno Matos','Carla Nunes','Daniel Prado','Elisa Moura','Fábio Teles','Gabriela Sá','Heitor Lins'];
  S.clientes=nomes.map(n=>({id:uid(),nome:n,tel:TEL_DEMO,email:'',nasc:'',obs:'',cpf:''}));
  const rnd=rndDemo(20261117), hj=hojeISO();
  const hoje=new Date(hj+'T12:00'), seg=somaDias(hj,-((hoje.getDay()+6)%7));      /* segunda desta semana */
  const slots=[[0,'08:00',0],[0,'19:00',1],[1,'10:00',0],[1,'18:00',2],[2,'09:00',0],[3,'17:00',1],[3,'20:00',0],[4,'14:00',0]];
  const pacote=new Set([0,4]), deve=new Set([3,6]);
  S.clientes.forEach((c,i)=>{
    const [dia,hora,si]=slots[i], s=sv[si], serie=uid(), link=si===1?'https://meet.google.com/lucra-exemplo':'';
    const ini=somaDias(seg,dia-7*6);
    for(let w=0;w<12;w++){ const d=somaDias(ini,w*7), passado=d<hj;
      const falta=passado&&rnd(12)===0;
      S.agenda.push({id:uid(),data:d,hora,clienteId:c.id,servicoId:s.id,obs:'',link,serie,status:passado?(falta?'faltou':'concluido'):'marcado'});
    }
  });
  /* pagamentos: pacote mensal de 4 sessões, por sessão no Pix, e alguns em aberto */
  const meses=[...new Set(S.agenda.filter(a=>a.status==='concluido').map(a=>mesDe(a.data)))];
  S.clientes.forEach((c,i)=>{
    const feitas=S.agenda.filter(a=>a.clienteId===c.id&&a.status==='concluido').sort((a,b)=>a.data.localeCompare(b.data));
    const s=serv(feitas[0].servicoId);
    if(pacote.has(i))meses.forEach(m=>{ const fm=feitas.filter(a=>mesDe(a.data)===m); if(!fm.length)return;
      S.vendas.push({id:uid(),data:m+'-01'<fm[0].data?fm[0].data:m+'-01',servicoId:s.id,valor:s.preco*4*0.9,forma:'pix',parcelas:1,
        sessoes:4,usadas:fm.slice(0,4).map(a=>a.data),desloc:0,clienteId:c.id,cliente:c.nome}) });
    else feitas.forEach((a,k)=>{
      if(deve.has(i)&&k>=feitas.length-2){ S.receber.push({id:uid(),clienteId:c.id,servicoId:s.id,valor:s.preco,data:a.data,desc:s.nome,agId:a.id}); return }
      S.vendas.push({id:uid(),data:a.data,servicoId:s.id,valor:s.preco,forma:['pix','pix','pix','debito','cred1'][rnd(5)],parcelas:1,clienteId:c.id,cliente:c.nome}) });
  });
  const f=S.agenda.find(a=>a.status==='faltou'); if(f)S.receber.push({id:uid(),clienteId:f.clienteId,servicoId:f.servicoId,valor:serv(f.servicoId).preco,data:f.data,desc:'Falta sem aviso',agId:f.id});
  /* evolução: uma paciente melhorando, um paciente piorando */
  const focos=[['Ansiedade no trabalho','Retomar respiração diafragmática'],['Relação com a mãe','Registro de pensamentos'],['Sono e rotina','Higiene do sono'],
    ['Autoestima','Lista de conquistas da semana'],['Luto','Carta não enviada'],['Limites no trabalho','Treinar dizer não'],['Planejamento da semana','Agenda de atividades prazerosas']];
  [[0,[3,3,4,4,5,5,6,6,7,7],'melhora'],[1,[6,6,5,5,4,4,3,4,3,3],'piora']].forEach(([i,hs,tend])=>{
    const c=S.clientes[i]; const feitas=S.agenda.filter(a=>a.clienteId===c.id&&a.status==='concluido').sort((a,b)=>a.data.localeCompare(b.data));
    feitas.forEach((a,k)=>{ const h=hs[Math.min(k,hs.length-1)], fo=focos[(k+i)%focos.length];
      S.evolucoes.push({id:uid(),clienteId:c.id,agId:a.id,data:a.data,foco:fo[0],chegada:h>=6?'Chegou tranquilo(a), relatou semana produtiva.':'Chegou abatido(a), relatou dificuldade para dormir.',
        humor:h,sinais:h<=4?(tend==='piora'&&k>=feitas.length-2?['Sinais depressivos','Alteração de sono','Isolamento social']:['Alteração de sono']):[],
        evolucao:k===0?'':(hs[k]>hs[k-1]?'melhora':hs[k]<hs[k-1]?'piora':'estavel'),notas:'',proximo:fo[1]}) });
  });
  const h0=new Date(), ant=new Date(h0.getFullYear(),h0.getMonth()-1,1), m=`${ant.getFullYear()}-${String(ant.getMonth()+1).padStart(2,'0')}`;
  [[m,'Aluguel da sala (meio período)',1200],[m,'Plataforma de vídeo',60],[m,'Supervisão clínica',450],[m,'Contador',250],[m,'Anuidade do conselho (parcela)',55],
   [mesAtual(),'Aluguel da sala (meio período)',1200],[mesAtual(),'Plataforma de vídeo',60]]
    .forEach(([mm,desc,valor],k)=>S.despesas.push({id:uid(),data:mm+'-0'+(5+k%4),desc,valor,servicoId:''}));
  S.perfil={nome:'',registro:'',doc:'',cidade:'São Paulo',endereco:''};
  mesSel=m;
}

function demoOdonto(){
  demoBase('odonto'); S.meta=40000;
  const sv=[['Avaliação e limpeza',250,25,180,26],['Restauração em resina',320,45,0,18],['Clareamento a laser',1200,220,365,4],
    ['Tratamento de canal',1100,120,0,5],['Extração simples',300,30,0,6],['Manutenção de aparelho',180,15,30,20],['Coroa de porcelana',1800,650,0,3]]
    .map(([nome,preco,custo,retorno,qtd])=>({id:uid(),nome,preco,precoMax:0,custo,comissao:0,retorno,qtd}));
  S.servicos=sv.map(({qtd,...s})=>s);
  S.clientes=['Marina Costa','Paulo Henrique','Renata Alves','Sérgio Lima','Tânia Rocha','Vitor Campos'].map(n=>({id:uid(),nome:n,tel:TEL_DEMO,email:'',nasc:'',obs:'',cpf:''}));
  const rnd=rndDemo(20261118), h=new Date(), ant=new Date(h.getFullYear(),h.getMonth()-1,1);
  const mes=`${ant.getFullYear()}-${String(ant.getMonth()+1).padStart(2,'0')}`, ult=new Date(ant.getFullYear(),ant.getMonth()+1,0).getDate();
  const dia=d=>`${mes}-${String(Math.max(1,Math.min(ult,d))).padStart(2,'0')}`;
  const formas=[['pix',1],['pix',1],['debito',1],['cred1',1],['parc',3],['parc',6],['parc',10]];
  sv.forEach(s=>{ for(let i=0;i<s.qtd;i++){ const f=formas[rnd(formas.length)], forma=s.preco>=1000&&f[0]!=='parc'?'parc':f[0], c=S.clientes[rnd(S.clientes.length)];
    S.vendas.push({id:uid(),data:dia(1+rnd(ult)),servicoId:s.id,valor:s.preco,forma,parcelas:forma==='parc'?Math.max(2,f[1]):1,clienteId:c.id,cliente:c.nome}) } });
  S.receber.push({id:uid(),clienteId:S.clientes[2].id,servicoId:sv[3].id,valor:550,data:dia(20),desc:'Canal · 2ª parte (boleto)',agId:''});
  const hj=hojeISO(), horas=['08:30','10:00','11:30','14:00','15:30','17:00'];
  for(let d=0;d<6;d++)for(let i=0;i<2+rnd(3);i++){ const s=sv[rnd(sv.length)], c=S.clientes[rnd(S.clientes.length)];
    S.agenda.push({id:uid(),data:somaDias(hj,d),hora:horas[(i+d)%horas.length],clienteId:c.id,servicoId:s.id,obs:'',status:'marcado'}) }
  S.despesas=[['Aluguel do consultório',3200,''],['Auxiliar de saúde bucal',2400,''],['Energia, água e internet',620,''],['Contador',400,''],
    ['Laboratório de prótese',1950,sv[6].id],['Resinas e adesivos',780,sv[1].id],['Gel clareador',600,sv[2].id],['Material de limpeza e descartáveis',450,sv[0].id],
    ['Manutenção do autoclave',300,'']].map(([desc,valor,servicoId],k)=>({id:uid(),data:dia(5+k*2),desc,valor,servicoId}));
  S.perfil={nome:'',registro:'',doc:'',cidade:'São Paulo',endereco:''};
  mesSel=mes;
}

