import Mdl0Base from './Mdl0Base';

export default class MdlPlayer extends Mdl0Base {
  static _collectionName = 'players';
  static _fieldNames = ['authUid', 'round', 'nickName', 'loseRound'];
  static _defaultValues = {
    currentRound: 1,
    loseRound: null
  };
  
  get _authUid() { return this.data['authUid']; }
  set _authUid(value) { this.data['authUid'] = value; }

  get _round() { return this.data['round']; }
  set _round(value) { this.data['round'] = value; }

  get _nickName() { return this.data['nickName']; }
  set _nickName(value) { this.data['nickName'] = value; }

  get _loseRound() { return this.data['loseRound']; }
  set _loseRound(value) { this.data['loseRound'] = value; }
}

// 動作テスト

// const ins = new MdlPlayer();
// ins._authUid = '111';
// ins._name = 'tkns';
// ins._originalKeyPlayer = 'orikey';
// ins._round = 5;

// await ins.save();
// console.log(ins);

// const ins2 = await MdlPlayer.get('IjltcHWcHaBnlczdE96r');
// console.log(ins2);

// // テストの続きから・・・
// const ins3 = new MdlPlayer('IjltcHWcHaBnlczdE96r');
// await ins3.load();
// console.log(ins3);

// const ins4 = new MdlPlayer('testkeyins4', true);
// console.log(ins4);
// ins4._name = 'ins4Name';
// ins4.save();

// const ins5 = await MdlPlayer.Create('IjltcHWcHaBnlczdE96r');
// console.log(ins5);

// const ins6 = await MdlPlayer.get('IjltcHWcHaBnlczdE96r');
// console.log(ins6);

// const ins7 = await MdlPlayer.getAll(
//   'name', '==', 'Takanashi Hitoshi'
// );
// console.log(ins7);

// const ins8 = await MdlPlayer.getAll([
//   'name', '==', 'Takanashi Hitoshi'
// ]);
// console.log(ins8);

// const ins9 = await MdlPlayer.getAll(
//   ['name', '==', 'Takanashi Hitoshi'],
//   ['authUid', '==', 'ngWgxjv8qKdbEU0HNxcpIAIPV8w1'],
// );
// console.log(ins9);

// console.log(await MdlPlayer.exists('IjltcHWcHaBnlczdE96r'));
// console.log(await MdlPlayer.exists('IjltcHWcHaBnlczdE96raaa'));
// console.log(await MdlPlayer.exists('name', '==', 'Takanashi Hitoshi'));
// console.log(await MdlPlayer.exists(['name', '==', 'Takanashi Hitoshi'], ['authUid', '==', 'ngWgxjv8qKdbEU0HNxcpIAIPV8w1']));
// console.log(await MdlPlayer.exists(['name', '==', 'Takanashi Hitoshi'], ['authUid', '==', 'ngWgxjv8qKdbEU0HNxcpIAIPV8w1aaa']));
// //console.log(await MdlPlayer.exists('IjltcHWcHaBnlczdE96raaa'));

// console.log(await MdlPlayer.count('IjltcHWcHaBnlczdE96r'));
// console.log(await MdlPlayer.count('IjltcHWcHaBnlczdE96raaa'));
// console.log(await MdlPlayer.count('name', '==', 'Takanashi Hitoshi'));
// console.log(await MdlPlayer.count(['name', '==', 'Takanashi Hitoshi'], ['authUid', '==', 'ngWgxjv8qKdbEU0HNxcpIAIPV8w1']));
// console.log(await MdlPlayer.count(['name', '==', 'Takanashi Hitoshi'], ['authUid', '==', 'ngWgxjv8qKdbEU0HNxcpIAIPV8w1aaa']));

// MdlPlayer.onChildAdded((data) => {
//   console.log("data added id: " + data.id);
// });

// MdlPlayer.onChildUpdated((data) => {
//   console.log("data updated id: " + data.id);
// });

// MdlPlayer.onChildDeleted((data) => {
//   console.log("data deleted id: " + data.id);
// });

// const ins10 = new MdlPlayer('testkeyins4');
// await ins10.load();
// ins10._originalKeyPlayer = 'ins10 updated';
// ins10.save();

// const ins11 = await MdlPlayer.Create('testkeyins4');
// ins11.delete();
// const ins12 = await MdlPlayer.Create('yHz9M2YYzX3BxkyV7w8O');
// ins12.delete();