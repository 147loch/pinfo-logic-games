import Route from './Route';

export default class IndexRoute extends Route {
  constructor(app) {
    super(app, '/', ['get']);
    this.id = 'index';
    this.title = "Loïc's Sudoku Website";
  }

  get(req, res) {
    res.render(this.id, { title: this.title });
  }
}
