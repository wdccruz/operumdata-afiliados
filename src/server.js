import { createApp } from './app.js';
const { app, db } = await createApp();
const server = app.listen(Number(process.env.PORT || 3100), process.env.HOST || '127.0.0.1', () => console.log('OperumData Afiliados · homologação iniciada'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
