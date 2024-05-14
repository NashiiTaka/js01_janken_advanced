import Mdl0Base from './Mdl0Base';

export default class MdlRound extends Mdl0Base {
  static _collectionName = 'rounds';
  static _fieldNames = ['round'];
  static get onlyOneRecordId() { return '0'; }

  get _round() { return this.data['round']; }
  set _round(value) { this.data['round'] = value; }

  /**
   * ラウンドを進める
   * @returns {Promise.<MdlRound>} 処理結果を待つPromise
   */
  static async AdvanceTheRound(){
    let mdl = (await this.get(this.onlyOneRecordId)) || new MdlRound(this.onlyOneRecordId, true);
    mdl._round = mdl.isNewData ? 1 : mdl._round + 1;
    return mdl.save();
  }
}
