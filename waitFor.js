export default ({ selector, timeout }) => {
  let interval = 0;
  const clear = () => clearInterval(interval);

  return new Promise((resolve, reject) => {
    setTimeout(reject, timeout);
    interval = setInterval(() => {
      const result = selector();
      if (result) resolve(result);
    })
  }).finally(clear);
}
