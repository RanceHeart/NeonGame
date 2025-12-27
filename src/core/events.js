export function createEvents() {
  const map = new Map(); // type -> Set<fn>

  function on(type, fn) {
    let set = map.get(type);
    if (!set) {
      set = new Set();
      map.set(type, set);
    }
    set.add(fn);
    return () => set.delete(fn);
  }

  function emit(type, payload) {
    const set = map.get(type);
    if (!set) {
      return;
    }
    set.forEach((fn) => fn(payload));
  }

  return { on, emit };
}
