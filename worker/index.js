export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "hilson.net") {
      url.hostname = "abdullah.hilson.net";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
