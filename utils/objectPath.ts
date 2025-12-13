
export function getByPath(obj: any, path: string) {
  if (!obj) return undefined;
  return path.split(".").reduce((o, k) => (o || {})[k], obj);
}

export function setByPath(obj: any, path: string, value: any) {
  const keys = path.split(".");
  // Create a shallow copy of the root object
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  
  let curr = clone;
  
  keys.slice(0, -1).forEach((k) => {
    // Create a shallow copy of the next level
    curr[k] = curr[k] ? (Array.isArray(curr[k]) ? [...curr[k]] : { ...curr[k] }) : {};
    curr = curr[k];
  });

  curr[keys[keys.length - 1]] = value;
  
  return clone;
}
