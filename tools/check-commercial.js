import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const directories=['public/painel','tools','supabase/functions/_shared'];
for(const directory of directories){for(const name of await readdir(directory)){if(!/\.(m?js)$/.test(name))continue;const result=spawnSync(process.execPath,['--check',`${directory}/${name}`],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}}
