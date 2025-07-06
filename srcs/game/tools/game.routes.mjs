export default async function (fastify, opts) {
  fastify.post('/game/init', async (req, res) => {
    game.reset();
    return res(200).send({ ok: true });
  });

  fastify.post('/game/start', async (req, res) => {
    game.start();
    return res(200).send({ ok: true });
  });

  fastify.post('/game/control/:player/:action', async (req, res) => {
    const player = Number(req.params.player);
    const action = req.params.action;
    game.control(player, action);
    return res(200).send({ ok: true });
  });
}