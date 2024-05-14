import Mdl0Base from './Mdl0Base';

export default class MdlMatch extends Mdl0Base {
  static _collectionName = 'matches';
  static _fieldNames = [
    'round',
    'uidPlayerA',
    'nickNamePlayerA',
    'uidPlayerB',
    'nickNamePlayerB',
    'executed',
    'uidWinner',
    'unexecutedMatch'
  ];
  static _defaultValues = {
    executed: false,
    uidWinner: null,
    unexecutedMatch: false
  };

  get _round() { return this.data['round']; }
  set _round(value) { this.data['round'] = value; }

  get _uidPlayerA() { return this.data['uidPlayerA']; }
  set _uidPlayerA(value) { this.data['uidPlayerA'] = value; }

  get _nickNamePlayerA() { return this.data['nickNamePlayerA']; }
  set _nickNamePlayerA(value) { this.data['nickNamePlayerA'] = value; }

  get _uidPlayerB() { return this.data['uidPlayerB']; }
  set _uidPlayerB(value) { this.data['uidPlayerB'] = value; }

  get _nickNamePlayerB() { return this.data['nickNamePlayerB']; }
  set _nickNamePlayerB(value) { this.data['nickNamePlayerB'] = value; }

  get _executed() { return this.data['executed']; }
  set _executed(value) { this.data['executed'] = value; }

  get _uidWinner() { return this.data['uidWinner']; }
  set _uidWinner(value) { this.data['uidWinner'] = value; }

  get _unexecutedMatch() { return this.data['unexecutedMatch']; }
  set _unexecutedMatch(value) { this.data['unexecutedMatch'] = value; }
}
