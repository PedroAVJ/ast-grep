import {spawn} from 'node:child_process';
import {relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {options,scoped,requireBinary,binary,bounded,emit} from './common.mjs';
async function search(opts,q){
 if(q.op!=='search')throw Error('Only read-only search is exposed');
 if(Object.keys(q).some(k=>!['op','lang','pattern','kind','paths','strictness'].includes(k)))throw Error('Unknown search field');
 if(typeof q.lang!=='string'||!q.lang)throw Error('lang is required');
 if((typeof q.pattern==='string')===(typeof q.kind==='string'))throw Error('Supply exactly one of pattern or kind');
 if(q.strictness&&!['cst','smart','ast','relaxed','signature','template'].includes(q.strictness))throw Error('Invalid strictness');
 const paths=q.paths??['.'];
 if(!Array.isArray(paths)||paths.length===0||paths.length>20)throw Error('Supply 1–20 paths');
 const args=['run','--lang',q.lang,...(q.pattern!==undefined?['--pattern',q.pattern]:['--kind',q.kind]),'--json=stream','--color','never','--threads','2'];
 if(q.strictness)args.push('--strictness',q.strictness);
 for(const dir of ['node_modules','bin','obj','.git','dist','build','.venv','venv','__pycache__'])args.push('--globs','!**/'+dir+'/**');
 args.push('--',...paths.map(p=>scoped(opts.root,p)));
 return new Promise((resolve,reject)=>{
  const child=spawn(binary,args,{cwd:opts.root,stdio:['ignore','pipe','pipe']});
  let buffer='',stderr='',count=0,failed=false;const matches=[];
  const timer=setTimeout(()=>fail(Error('ast-grep timeout')),opts.timeout);
  const interrupted=()=>fail(Error('Interrupted'));
  process.once('SIGINT',interrupted);process.once('SIGTERM',interrupted);
  function clean(){clearTimeout(timer);process.removeListener('SIGINT',interrupted);process.removeListener('SIGTERM',interrupted);}
  function fail(e){if(failed)return;failed=true;child.kill('SIGKILL');clean();reject(e);}
  function consume(line){
   if(!line.trim())return;
   const m=JSON.parse(line);count++;
   if(matches.length<opts.limit)matches.push({file:relative(opts.root,m.file),line:m.range.start.line+1,column:m.range.start.column+1,endLine:m.range.end.line+1,endColumn:m.range.end.column+1,text:m.text.slice(0,500),textTruncated:m.text.length>500});
  }
  child.on('error',fail);
  child.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-3000);});
  child.stdout.setEncoding('utf8');
  child.stdout.on('data',b=>{
   try{
    buffer+=b;
    let newline;while((newline=buffer.indexOf('\n'))!==-1){consume(buffer.slice(0,newline));buffer=buffer.slice(newline+1);}
    if(buffer.length>4*1024*1024)fail(Error('Single AST match exceeds 4 MB; narrow search'));
   }catch(e){fail(e);}
  });
  child.on('close',code=>{
   clean();if(failed)return;
   try{
    consume(buffer);
    if(code!==0&&code!==1)throw Error('ast-grep failed ('+code+'): '+stderr);
    resolve({count,matches,truncated:count>matches.length,omitted:Math.max(0,count-matches.length),...(stderr?{warnings:stderr}:{})});
   }catch(e){reject(e);}
  });
 });
}
export async function main(){
 const opts=options();
 if(opts.help){emit({usage:'node scripts/query.mjs --root PROJECT --queries JSON [--limit 40] [--timeout 90000]',queries:[{op:'search',lang:'typescript',pattern:'$OBJ.$METHOD($$$ARGS)',paths:['src']},{op:'search',lang:'csharp',kind:'class_declaration',paths:['.']}],readOnly:true,notes:'Patterns, not type-aware references. Matches honor ignores; generated/dependency directories excluded. Single-quote JSON to protect $ metavariables from shell expansion.'});return;}
 requireBinary();const results=[],started=Date.now();
 for(const [index,q]of opts.queries.entries()){
  try{const value=await search(opts,q);results.push({index,...bounded(value,opts.limit)});}
  catch(e){results.push({index,error:e.message});}
 }
 emit({plugin:'ast-grep',elapsedMs:Date.now()-started,results});
 if(results.some(x=>x.error))process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main().catch(e=>{emit({error:e.message});process.exitCode=1;});

