import Route from './Route';

export default class UsersRoute extends Route {
  constructor(app) {
    super(app, '/users/:id', ['get']);

    this.id = 'users';
    this.title = 'Users';
  }

  static get(req, res) {
    console.log(req.params);
    res.send(`respond with a resource: ${req.params.id}`);
  }
}
