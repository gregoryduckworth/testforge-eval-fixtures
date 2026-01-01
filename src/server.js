import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3100);
createApp().listen(port, () => console.log(`products-api on http://localhost:${port}`));
