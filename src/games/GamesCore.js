import games from './classes';

export default class GamesCore {
  constructor(app) {
    this.app = app;

    this.lastId = -1;
    this.games = new Map();
  }

  registerGame(type) {
    this.lastId += 1;
    const id = this.lastId;

    if (games[type]) {
      // eslint-disable-next-line new-cap
      const game = new games[type].default(this.app, id);

      if (this.games.has(game.type)) {
        const gamesObject = this.games.get(game.type);
        gamesObject[id] = game;
        this.games.set(game.type, gamesObject);
      } else {
        this.games.set(game.type, { [id]: game });
      }

      return this.games.get(game.type)[id];
    }

    Object.keys(games).forEach(gameId => {
      // eslint-disable-next-line new-cap
      const game = new games[gameId].default(this.app, id);
      if (type === game.type) {
        if (this.games.has(type)) {
          const gamesObject = this.games.get(type);
          gamesObject[id] = game;
          this.games.set(type, gamesObject);
        } else {
          this.games.set(type, { [id]: game });
        }
      }
    });

    return this.games.get(type)[id];
  }
}
