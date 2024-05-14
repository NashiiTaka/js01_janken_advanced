import Mdl0Base from './Mdl0Base';

export default class MdlAuthUser extends Mdl0Base {
  static _collectionName = 'auth_users';
  static _fieldNames = ['nickName'];

  get _nickName() { return this.data['nickName']; }
  set _nickName(value) { this.data['nickName'] = value; }
}

// const mdlUser = new MdlAuthUser(at.user.uid, true);
// mdlUser._nickName = trimedName;
// mdlUser.onSnapshot((data, cahngeType) => {
//   console.log('fired: ' + cahngeType + '  id: ' + data.id);
// });
// await mdlUser.save();
// console.log('save() 1');
// mdlUser._nickName = 'aaa';
// await mdlUser.save();
// console.log('save() 2');
// await mdlUser.delete();
// console.log('delete 1');

// const mdlUser2 = new MdlAuthUser('tempiddesuyo', true);
// mdlUser2._nickName = 'test name';
// const unsubscribe = mdlUser2.onSnapshot((data, cahngeType) => {
//   console.log('fired: ' + cahngeType + '  id: ' + data.id);
// });
// await mdlUser2.save();
// console.log('save() 3');
// mdlUser2._nickName = 'aaa';
// await mdlUser2.save();
// console.log('save() 4');

// unsubscribe();
// mdlUser2._nickName = 'bbb';
// await mdlUser2.save();
// console.log('save() 5');
// mdlUser2._nickName = 'ccc';
// await mdlUser2.save();
// console.log('save() 6');
// await mdlUser2.delete();
// console.log('delete 7');