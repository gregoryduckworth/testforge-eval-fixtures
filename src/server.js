import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3200);
createApp().listen(port, () => console.log(`orders-api on http://localhost:${port}`));
