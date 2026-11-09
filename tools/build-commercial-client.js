import { build } from 'esbuild';
await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',target:'es2022',supported:{'template-literal':false},minify:true,outfile:'public/painel/vendor/supabase.js',legalComments:'eof'});
