import Route from './Route';

export default class IndexRoute extends Route {
  constructor(app) {
    super(app, '/generate', ['get']);
    this.id = 'generate';
    this.title = "Generate Sudokus - Loïc's Sudoku Website";
  }

  get(req, res) {
    res.render(this.id, {
      title: this.title,
      query: req.query,
      id: this.id,
    });
  }
}
