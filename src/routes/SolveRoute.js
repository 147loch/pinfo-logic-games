import Route from './Route';

export default class IndexRoute extends Route {
  constructor(app) {
    super(app, '/solve', ['get']);
    this.id = 'solve';
    this.title = "Solve Sudoku - Loïc's Sudoku Website";
  }

  get(req, res) {
    res.render(this.id, { title: this.title, query: req.query, id: this.id });
  }
}
