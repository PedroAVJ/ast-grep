import {readFileSync, realpathSync, existsSync} from 'node:fs';
import {dirname, resolve, relative, isAbsolute, join} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const pluginRoot=resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const config=JSON.parse(readFileSync(join(pluginRoot,'server.json'),'utf8'));
export const runtime=join(homedir(),'.local','share','code-navigation',config.name,createHash('sha256').update(JSON.stringify(config)).digest('hex').slice(0,12));
export const binary=join(runtime,config.dotnet?'tools':'node_modules/.bin',config.bin);
export function options(args=process.argv.slice(2)){
 const opts={};
 for(let i=0;i<args.length;i++){
  if(args[i]==='--help'){opts.help=true;continue;}
  if(!['--root','--queries','--timeout','--limit','--settings'].includes(args[i]))throw Error('Unknown option: '+args[i]);
  if(args[i+1]===undefined)throw Error('Missing option value');
  const key=args[i].slice(2);if(key in opts)throw Error('Duplicate option: '+key);opts[key]=args[++i];
 }
 if(opts.help)return opts;
 if(!opts.root||!opts.queries)throw Error('--root and --queries are required');
 opts.root=realpathSync(opts.root);
 opts.queries=JSON.parse(opts.queries);
 if(!Array.isArray(opts.queries)||!opts.queries.length||opts.queries.length>20)throw Error('Supply 1–20 queries');
 opts.timeout=Number(opts.timeout??90000);opts.limit=Number(opts.limit??40);
 if(!Number.isInteger(opts.timeout)||opts.timeout<100||opts.timeout>180000)throw Error('timeout must be 100–180000 ms');
 if(!Number.isInteger(opts.limit)||opts.limit<1||opts.limit>200)throw Error('limit must be 1–200');
 opts.settings=opts.settings?JSON.parse(opts.settings):{};
 return opts;
}
export function scoped(root,file){
 if(typeof file!=='string'||!file)throw Error('A file/path is required');
 const full=realpathSync(resolve(root,file)), rel=relative(root,full);
 if(rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw Error('Path escapes project root');
 return full;
}
export function requireBinary(){if(!existsSync(binary))throw Error('Runtime missing. Run: node '+join(pluginRoot,'scripts','setup.mjs'));}
export function bounded(value,limit){
 let clipped=0;
 function walk(v){
  if(typeof v==='string'&&v.length>1800){clipped++;return v.slice(0,1800)+' … [truncated]';}
  if(Array.isArray(v)){if(v.length>limit)clipped+=v.length-limit;return v.slice(0,limit).map(walk);}
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(x)]));
  return v;
 }
 let result=walk(value);
 if(JSON.stringify(result).length>24000){result={summary:'Result exceeds 24000 characters; narrow the query or reduce --limit',sample:JSON.stringify(result).slice(0,1800)};clipped++;}
 return {result,truncated:clipped>0,omittedOrClipped:clipped};
}
export function emit(value){process.stdout.write(JSON.stringify(value)+'\n');}

