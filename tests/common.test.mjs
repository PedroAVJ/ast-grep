import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {readFileSync,statSync} from 'node:fs';
import {options,scoped,bounded,pluginRoot,config} from '../scripts/common.mjs';
test('JSON batch validates bounds and rejects unknown/duplicate options',()=>{
 const args=['--root',pluginRoot,'--queries','[{"op":"symbols","file":"server.json"}]'];
 assert.equal(options(args).queries.length,1);
 for(const extra of [['--limit','0'],['--limit','201'],['--timeout','0'],['--wat','1'],['--root',pluginRoot]])assert.throws(()=>options([...args,...extra]));
 assert.throws(()=>options(['--root',pluginRoot,'--queries','[]']));
 assert.throws(()=>options(['--root',pluginRoot,'--queries',JSON.stringify(Array(21).fill({}))]));
});
test('input file paths cannot escape selected project root',()=>{
 assert.equal(scoped(pluginRoot,'server.json'),resolve(pluginRoot,'server.json'));
 assert.throws(()=>scoped(pluginRoot,'..'),/escapes/);
});
test('output is bounded with explicit truncation',()=>{
 const result=bounded({items:[1,2,3],text:'x'.repeat(5000)},2);
 assert.equal(result.truncated,true);assert.equal(result.result.items.length,2);
 assert.ok(result.result.text.endsWith('[truncated]'));
});
test('source package and both manifests agree',()=>{
 const pkg=JSON.parse(readFileSync(resolve(pluginRoot,'package.json')));
 for(const folder of ['.codex-plugin','.claude-plugin']){
  const manifest=JSON.parse(readFileSync(resolve(pluginRoot,folder,'plugin.json')));
  assert.equal(manifest.name,config.name);assert.equal(manifest.version,pkg.version);
 }
});
test('Codex manifest references a tracked, non-empty program icon',()=>{
 const codex=JSON.parse(readFileSync(resolve(pluginRoot,'.codex-plugin','plugin.json')));
 const claude=JSON.parse(readFileSync(resolve(pluginRoot,'.claude-plugin','plugin.json')));
 assert.equal(codex.interface.category,'Developer Tools');
 assert.equal(codex.interface.brandColor,'#4338CA');
 assert.equal(codex.interface.composerIcon,'./assets/ast-grep-icon.svg');
 assert.equal(codex.interface.logo,codex.interface.composerIcon);
 assert.ok(statSync(resolve(pluginRoot,codex.interface.logo)).size>0);
 assert.match(readFileSync(resolve(pluginRoot,codex.interface.logo),'utf8'),/^<svg/);
 assert.match(readFileSync(resolve(pluginRoot,'ICON-SOURCES.md'),'utf8'),/assets\/ast-grep-icon.svg/);
 assert.equal(claude.skills,codex.skills);
});
