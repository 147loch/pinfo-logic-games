import Route from './Route';

export default class IndexRoute extends Route {
  constructor(app) {
    super(app, '/play', ['get']);
    this.id = 'play';
    this.title = "Play Sudoku Games - Loïc's Sudoku Website";
  }

  get(req, res) {
    res.render(this.id, {
      title: this.title,
      query: req.query,
      id: this.id,
    });
  }
}
