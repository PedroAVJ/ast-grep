import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {pluginRoot} from '../scripts/common.mjs';
function query(queries,limit=40){
 const run=spawnSync(process.execPath,[resolve(pluginRoot,'scripts/query.mjs'),'--root',resolve(pluginRoot,'tests/fixtures'),'--queries',JSON.stringify(queries),'--limit',String(limit)],{encoding:'utf8',timeout:15000});
 return {run,out:JSON.parse(run.stdout)};
}
test('real AST batch matches syntax and reports exact truncation',()=>{
 const file=resolve(pluginRoot,'tests/fixtures/fixture.ts'),before=readFileSync(file,'utf8');
 const {run,out}=query([{op:'search',lang:'typescript',pattern:'greet($$$ARGS)'},{op:'search',lang:'typescript',kind:'function_declaration'}],1);
 assert.equal(run.status,0,run.stdout+run.stderr);
 assert.equal(out.results[0].result.count,2);assert.equal(out.results[0].result.matches.length,1);
 assert.equal(out.results[0].result.truncated,true);assert.equal(out.results[1].result.count,1);
 assert.equal(readFileSync(file,'utf8'),before);
});
test('no matches is distinct from malformed patterns or rewrite attempts',()=>{
 const no=query([{op:'search',lang:'typescript',pattern:'absent($$$ARGS)'}]);
 assert.equal(no.run.status,0);assert.equal(no.out.results[0].result.count,0);
 const denied=query([{op:'search',lang:'typescript',pattern:'greet($$$ARGS)',rewrite:'oops'}]);
 assert.equal(denied.run.status,1);assert.match(denied.out.results[0].error,/Unknown/);
 const invalid=query([{op:'search',lang:'not-a-language',pattern:'x'}]);
 assert.equal(invalid.run.status,1);assert.ok(invalid.out.results[0].error);
});

