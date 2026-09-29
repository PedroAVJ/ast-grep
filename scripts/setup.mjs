import {mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {config,runtime,binary,pluginRoot,emit} from './common.mjs';
mkdirSync(runtime,{recursive:true});
if(!existsSync(binary)){
 let command,args;
 if(config.dotnet){command='dotnet';args=['tool','install',config.dotnet,'--version',config.version,'--tool-path',join(runtime,'tools')];}
 else{
  for(const f of ['package.json','package-lock.json'])copyFileSync(join(pluginRoot,'runtime',f),join(runtime,f));
  command='npm';args=['ci','--prefix',runtime,'--no-audit','--no-fund','--ignore-scripts'];
 }
 const run=spawnSync(command,args,{stdio:['ignore','inherit','inherit'],timeout:180000});
 if(run.error||run.status!==0)throw run.error??Error('Runtime installation failed: '+run.status);
 if(config.name==='ast-grep'){
  const run=spawnSync(process.execPath,[join(runtime,'node_modules','@ast-grep','cli','postinstall.js')],{cwd:join(runtime,'node_modules','@ast-grep','cli'),stdio:'inherit',timeout:30000});
  if(run.error||run.status!==0)throw run.error??Error('ast-grep binary setup failed');
 }
}
if(!existsSync(binary))throw Error('Expected runtime binary missing: '+binary);
emit({ready:true,plugin:config.name,binary,runtime});

