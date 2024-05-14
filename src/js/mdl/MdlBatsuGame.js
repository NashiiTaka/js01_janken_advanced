import Mdl0Base from './Mdl0Base';

export default class MdlBatsuGame extends Mdl0Base {
  static _collectionName = 'batsu_game';
  static _fieldNames = ['batsuGame'];

  get _batsuGame() { return this.data['batsuGame']; }
  set _batsuGame(value) { this.data['batsuGame'] = value; }
}
