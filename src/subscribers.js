/** Who is told when records change, by topic. One list for the whole process. */
const handlers = new Map();

/** Calls `handler` with every message published on `topic`. Returns a function that stops it. */
export function subscribe(topic, handler) {
  const list = handlers.get(topic) ?? [];
  list.push(handler);
  handlers.set(topic, list);
  return () => {
    const current = handlers.get(topic) ?? [];
    handlers.set(
      topic,
      current.filter((h) => h !== handler),
    );
  };
}

/** Sends `message` to every handler subscribed to `topic`; returns how many it reached. */
export function publish(topic, message) {
  const list = handlers.get(topic) ?? [];
  for (const handler of list) handler(message);
  return list.length;
}
