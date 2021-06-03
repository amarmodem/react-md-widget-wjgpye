const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export default {
  getWidgetUrl: async () => {
    await wait(500);
    return { url: 'https://int-widgets.moneydesktop.com/md/abc123' };
  }
}