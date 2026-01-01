import { createApp } from './app.js';
import { warmSearch } from './search.js';
import { CUSTOMERS } from './store.js';

const port = Number(process.env.PORT ?? 4310);
await warmSearch(CUSTOMERS);
createApp().listen(port, () => console.log(`orders-api on http://localhost:${port}`));
