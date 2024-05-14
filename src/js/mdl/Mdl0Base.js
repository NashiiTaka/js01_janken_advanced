import { db } from './firebaseAppIns';
import * as fs from 'firebase/firestore';

/**
 * FireStoreの1ドキュメントを管理するクラスのベース
 * オーバーライドする。
 * static #collectionName = null;
 * static #fieldNames = null;
 * // 以下はサブコレクションが存在する場合のみ
 * static #subCollectionNames = [];
 */
export default class Mdl0Base {
  /**
   * コレクション名
   * @type {string}
   */
  static get collectionName() {
    return this._collectionName;
  }
  // 要継承先でオーバーライドする
  /** @type {string} */
  static _collectionName = null;

  /**
   * フィールド名の配列
   * @type {Array.<string>}
   */
  static get fieldNames() {
    return this._fieldNames;
  }
  // 要継承先でのオーバーライド
  /** @type {Array.<string>} */
  static _fieldNames = null;

  /**
   * サブコレクション名の配列
   * @type {Array.<string>}
   */
  static get subCollectionNames() {
    return this._subCollectionNames;
  }
  // 要継承先でのオーバーライド
  /** @type {Array.<string>} */
  static _subCollecObject

  /**
   * デフォルト値の配列。新規保存時に未設定のフィールドがあった場合、この値で設定して登録を行う。
   * @type {Object}
   */
  static get defaultValues() {
    return this._defaultValues;
  }
  // 要継承先でのオーバーライド
  /** @type {Object} */
  static _defaultValues = {};

  /**
   * 管理対象のテーブルのDBコレクションリファレンス
   * @type { fs.CollectionReference }
   */
  static get refCollection() {
    this._refCollection = this._refCollection || fs.collection(db, this.collectionName);
    return this._refCollection;
  }
  static _refCollection = null; // fs.collection(db, this.tabelName); // 継承先のtabelNameが取れなかったので、メソッド呼び出し時に初期化する。

  /**
   * インスタンスを生成
   * @param {string | fs.DocumentSnapshot} idOrSnapshot 
   * @returns {Promise.<Mdl0Base>}
   */
  static async Create(idOrSnapshot) {
    return new Promise(async (resolve) => {
      if (typeof idOrSnapshot == 'string') {
        const ins = new this.prototype.constructor(idOrSnapshot);
        await ins.load();
        resolve(ins);
      } else {
        resolve(new this.prototype.constructor(idOrSnapshot));
      }
    });
  }

  /**
   * IDを指定して1件のデータを取得する。
   * @param {*} id 
   * @returns {Promise.<Mdl0Base>}
   */
  static async get(id) {
    return new Promise(async (resolve) => {
      const doc = await fs.getDoc(fs.doc(db, this.collectionName, id));
      const ins = doc.exists() ? new this.prototype.constructor(doc) : null;
      resolve(ins);
    });
  }

  /**
   * 条件に合致するデータをすべて取得する
   * @param {...string | Array.<string[]>} conditions 単一条件=>string×3 field名、比較演算子、検索語 複合条件=>[field名、比較演算子、検索語],[field名、比較演算子、検索語]・・・
   * @returns {Promise.<Array.<Mdl0Base>>} Mdlクラスインスタンスの配列
   */
  static async getAll(...conditions) {
    return new Promise(async (resolve) => {
      if (!conditions || conditions.length === 0) { resolve([]); }

      let editedCond = null
      if (!Array.isArray(conditions[0])) {
        editedCond = [conditions];
      } else {
        editedCond = [];
        const recursive = (arr) => {
          for (const v of arr)
            if (!Array.isArray(v)) {
              editedCond.push(arr);
              break;
            } else {
              recursive(v);
            }
        }
        recursive(conditions);
      };

      const searchConds = [];
      for (const cond of editedCond) {
        searchConds.push(fs.where(cond[0], cond[1], cond[2]));
      }

      const query = fs.query(this.refCollection, ...searchConds);
      const docs = await fs.getDocs(query);
      const ret = [];
      docs.forEach((doc) => {
        ret.push(new this.prototype.constructor(doc));
      });

      resolve(ret);
    });
  }

  /**
   * 存在するかを確認する。
   * @param {string | ...string | Array.<string[]>} idOrConditions [ID] or [単一条件=>string×3 field名、比較演算子、検索語] or [複合条件=>[field名、比較演算子、検索語],[field名、比較演算子、検索語]・・・]
   * @returns {Promise.<bool>} 処理完了を待つPromise
   */
  static async exists(...idOrConditions) {
    if (idOrConditions.length === 1 && typeof idOrConditions[0] === 'string') {
      return (await this.get(idOrConditions[0])) !== null;
    } else {
      return (await this.getAll(...idOrConditions)).length > 0;
    }
  }

  /**
   * 条件に合致する数
   * @param {string | ...string | Array.<string[]>} idOrConditions [ID] or [単一条件=>string×3 field名、比較演算子、検索語] or [複合条件=>[field名、比較演算子、検索語],[field名、比較演算子、検索語]・・・]
   * @returns {Promise.<Number>}
   */
  static async count(...idOrConditions) {
    if (idOrConditions.length === 1 && typeof idOrConditions[0] === 'string') {
      return (await this.get(idOrConditions[0])) !== null ? 1 : 0;
    } else {
      return (await this.getAll(...idOrConditions)).length;
    }
  }

  /**
   * 全データを削除する
   * @returns {Promise[]} 処理完了を待つPromise
   */
  static async deleteAll() {
    const promises = [];

    const snapshot = await fs.getDocs(this.refCollection);
    snapshot.forEach((d) => {
      // ここでawaitをかけても処理を止められなかった。
      // そのため、promiseの配列を返却し、呼び出し元でawaitをかける。
      // 動作仕様は理解できていない。
      promises.push(fs.deleteDoc(d.ref));
    });

    return promises;
  }

  /**
   * Mdlのイベントのcallback
   * @callback callBackForMdlEvent
   * @param {Mdl0Base} mdlData Mdl0Baseを継承するクラスインスタンス
   * @param {string} changeType "added", "modified", "removed"
   */

  /**
   * 追加時
   * @param {callBackForMdlEvent} callback 
   * @returns {fs.Unsubscribe} デタッチコールバック
   */
  static onChildAdded(callback) {
    return this.setOnSnapshot(callback, "added");
  }

  /**
   * 更新時
   * @param {callBackForMdlEvent} callback 
   * @returns {fs.Unsubscribe} デタッチコールバック
   */
  static onChildUpdated(callback) {
    return this.setOnSnapshot(callback, "modified");
  }

  /**
   * 削除時
   * @param {callBackForMdlEvent} callback 
   * @returns {fs.Unsubscribe} デタッチコールバック
   */
  static onChildDeleted(callback) {
    return this.setOnSnapshot(callback, "removed");
  }

  /**
   * 追加 or 削除時
   * @param {callBackForMdlEvent} callback 
   * @returns {function} fs.Unsubscribeを事項するデタッチコールバック
   */
  static onChildAddedOrUpdated(callback) {
    const unsubscribes = [
      this.setOnSnapshot(callback, "added"),
      this.setOnSnapshot(callback, "modified")
    ]
    return () => { unsubscribes.forEach(unsubscribe => unsubscribe()); }
  }

  /**
   * アタッチの共通処理。RealtimeDatabaseのon〜イベントを再現する。
   * @param {callBackForMdlEvent} callback 
   * @param {string} "added", "modified", "removed" のいずれかを指定する
   * @param {fs.CollectionReference | fs.Query} [ref] 参照先をカスタマイズしたい場合にしてする。
   * @param {Mdl0Base} [callbackIns] callbackの際に返却するインスタンス。設定されていなければnewして返却。
   * @returns {fs.Unsubscribe} デタッチコールバック
   */
  static setOnSnapshot(callback, changeType, ref = null, callbackIns) {
    if (!["added", "modified", "removed"].includes(changeType)) {
      throw new Error('不正な changeType です。');
    }

    const unsubscribe = fs.onSnapshot(ref || this.refCollection, (snapshot) => {
      if (typeof snapshot.docChanges != "function") {
        throw new Error('snapshot.docChanges is not a function');
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === changeType) {

          if(callbackIns && callbackIns.updateSync && change.type === 'modified'){
            const mdl = new this.prototype.constructor(change.doc);
            for(const key in mdl.data){
              callbackIns.data[key] = mdl.data[key];
            }
          }

          callback(callbackIns || new this.prototype.constructor(change.doc), change.type);
        }
      });
    });

    // デタッチファンクションを返却する。
    return unsubscribe;
  }
  // static



  /**
   * コンストラクタ
   * @param {string | fs.DocumentSnapshot} idOrDocSnapshot ID文字列か、DocumentSnapshot
   * @param {boolean} isNewData 新規データの場合true
   */
  constructor(idOrDocSnapshot = null, isNewData = false) {
    if (typeof idOrDocSnapshot == 'string') {
      // type = 'id';
      this.#id = idOrDocSnapshot;
      if (isNewData) {
        this.#data = {};
        this.#loaded = true;
      }
      this.#isNewData = isNewData;
    } else if (idOrDocSnapshot) {
      // type = 'ss';
      if (isNewData) {
        throw new Error('docSnapshotを指定した場合、isNewRecordはfalseを指定してください');
      }
      this.#id = idOrDocSnapshot.id;
      this.#data = idOrDocSnapshot.data();
      this.#loaded = true;
      this.#isNewData = false;
    } else {
      // type= 'new';
      this.#data = {};
      this.#loaded = true;
      this.#isNewData = true;
    }

    // 下記でPG上は十分だが、インテリセンスが聞かないので、プロパティは下位クラスでフィールドごとに実装する。
    // フィールド名の配列から、動的にプロパティを生成する。
    // this.constructor.fieldNames.forEach((fieldName) => {
    //   Object.defineProperty(this, '_' + fieldName, {
    //     get() { return this.data[fieldName]; },
    //     set(value) { this.data[fieldName] = value; }
    //   });
    // });
  }

  /**
   * ドキュメントリファレンスを取得する
   * @type {fs.DocumentReference}
   */
  get refDoc() {
    if (!this.id) { throw new Error('refDocを取得するためには、idを指定してください。'); }
    return fs.doc(db, this.constructor.collectionName, this.id);
  }

  /**
   * 自分自身のみを参照するクエリを取得する
   * @type {fs.Query} 自分自身のみを参照するクエリ
   */
  get queryMeById() {
    if (!this.id) { throw new Error('queryMeByIdを使用するには、先にidを指定してください。'); }
    return fs.query(this.constructor.refCollection, fs.where(fs.documentId(), '==', this.id));
  }

  /**
   * id
   * @type {string}
   */
  get id() {
    return this.#id;
  }
  #id;

  /**
   * 新規データ
   * @type {boolean}
   */
  get isNewData() { return this.#isNewData; };
  set isNewData(value) { this.#isNewData = value; };
  #isNewData = null;

  /**
   * サーバーでのDB更新時にデータの書き換えを行う。
   * @type {boolean}
   */
  get updateSync() { return this.#updateSyncUnsubscribe !== null; };
  set updateSync(value) {
    if(this.#updateSyncUnsubscribe === null && value){
      this.#updateSyncUnsubscribe = this.onUpdated((mdl) => {
        // 値の更新処理は、共通メソッドで実施する。
      });
    }else if(this.#updateSyncUnsubscribe !== null && !value){
      this.#updateSyncUnsubscribe();
      this.#updateSyncUnsubscribe = null;
    }
  };
  #updateSyncUnsubscribe = null;

  /**
   * データ
   * @type {object}
   */
  get data() {
    if (!this.#loaded) { throw new Error('dataへのアクセス前に、loadを実行してください。') };
    return this.#data;
  }
  #data = null;

  /**
   * IDを元にデータを取得する。
   * @returns {Promise} データ取得を待つPromise
   */
  async load() {
    return new Promise(async (resolve) => {
      if (this.#loaded) {
        resolve();
      } else {
        const ss = await fs.getDoc(this.refDoc);
        this.#data = ss.exists() ? ss.data() : {};
        this.#loaded = true;
        resolve();
      }
    })
  }
  #loaded = false;

  
  /**
   * 登録 or 更新を行う
   * @returns {Promise.<Mdl0Base>} 処理完了を待つPromise
   */
  async save() {
    return this.isNewData ? this.add() : this.update();
  }

  /**
   * 追加
   * @returns {Promise.<Mdl0Base>} 処理完了を待つPromise
   */
  async add() {
    if (!this.isNewData) { throw new Error('非新規データに対して、addが呼ばれました。'); }
    return new Promise(async (resolve) => {
      // デフォルト値が設定されているフィールドがあれば、それに値を代入する。
      for(const key in this.constructor.defaultValues){
        if(this.data[key] === undefined){
          this.data[key] = this.constructor.defaultValues[key];
        }
      }

      const now = new Date();
      if (this.id) {
        await fs.setDoc(this.refDoc, { ...this.data, created_at: now, updated_at: now });
      } else {
        const doc = await fs.addDoc(this.constructor.refCollection, { ...this.data, created_at: now, updated_at: now });
        this.#id = doc.id;
      }
      this.isNewData = false;

      resolve(this);
    });
  }

  /**
   * 登録しようとしているデータが存在しない場合のみ登録する。
   * idが設定されている場合はidで検索。idが設定されていない場合は
   * @returns {Promise.<Mdl0Base>} 処理完了を待つPromise。ID未指定の場合は、idが発行されていたら登録されたということ。
   */
  async addIfNotExists() {
    if (!this.isNewData) { throw new Error('非新規データに対して、addが呼ばれました。'); }

    return new Promise(async (resolve) => {
      let shouldAdd = false;
      if(this.id){
        shouldAdd = !(await this.constructor.exists(this.id));
      }else{
        const seachCond = [];
        for(const key in this.data){
          seachCond.push([key, '==', this.data[key]]);
        }
        shouldAdd = !(await this.constructor.exists(seachCond));
      }

      if(shouldAdd){
        await this.add();
      }

      resolve(this);
    });
  }

  /**
   * 更新
   * @returns {Promise.<Mdl0Base>} 処理完了を待つPromise
   */
  async update() {
    if (this.isNewData) { throw new Error('新規データに対して、udpateが呼ばれました。'); }
    return new Promise(async (resolve) => {
      await fs.updateDoc(this.refDoc, { ...this.data, updated_at: new Date() });
      resolve(this);
    });
  }

  /**
   * 削除
   * @returns {Promise.<Mdl0Base>} 処理完了を待つPromise
   */
  async delete() {
    if (this.isNewData) { throw new Error('新規データに対して、deleteが呼ばれました。'); }
    return new Promise(async (resolve) => {
      await fs.deleteDoc(this.refDoc);
      resolve(this);
    });
  }

  /**
   * 追加時
   * @param {callBackForMdlEvent} callback 
   * @returns {fs.Unsubscribe} デタッチコールバック
   */
  onAdded(callback) {
    return this.constructor.setOnSnapshot(callback, "added", this.queryMeById, this);
  }

  /**
   * 更新時
   * @param {callBackForMdlEvent} callback 
   * @returns {fs.Unsubscribe} デタッチコールバック
   */
  onUpdated(callback) {
    return this.constructor.setOnSnapshot(callback, "modified", this.queryMeById, this);
  }

  /**
   * 削除時
   * @param {callBackForMdlEvent} callback 
   * @returns {fs.Unsubscribe} デタッチコールバック
   */
  onDeleted(callback) {
    return this.constructor.setOnSnapshot(callback, "removed", this.queryMeById, this);
  }

  /**
   * 追加 or 削除時
   * @param {callBackForMdlEvent} callback 
   * @returns {function} fs.Unsubscribeを事項するデタッチコールバック
   */
  onAddedOrUpdated(callback) {
    const unsubscribes = [
      this.constructor.setOnSnapshot(callback, "added", this.queryMeById, this),
      this.constructor.setOnSnapshot(callback, "modified", this.queryMeById, this)
    ];
    return () => { unsubscribes.forEach(unsubscribe => unsubscribe()); }
  }

  /**
   * 追加・変更・更新時すべてを監視
   * @param {callBackForMdlEvent} callback 
   * @returns {function} fs.Unsubscribeを事項するデタッチコールバック
   */
  onSnapshot(callback) {
    const unsubscribes = [
      this.constructor.setOnSnapshot(callback, "added", this.queryMeById, this),
      this.constructor.setOnSnapshot(callback, "modified", this.queryMeById, this),
      this.constructor.setOnSnapshot(callback, "removed", this.queryMeById, this)
    ];
    return () => { unsubscribes.forEach(unsubscribe => unsubscribe()); }
  }
}
