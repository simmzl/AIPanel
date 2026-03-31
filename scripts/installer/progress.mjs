export function progress(message, extra = {}) {
  const payload = {
    type: 'installer-progress',
    message,
    ...extra
  };
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
}
