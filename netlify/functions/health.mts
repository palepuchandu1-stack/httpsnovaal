import type { Config } from '@netlify/functions';
export default async () => Response.json({ok:true,app:'Nova AI'});
export const config: Config = {path:'/api/health',method:'GET'};
