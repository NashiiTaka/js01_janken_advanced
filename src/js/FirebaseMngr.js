import app from './mdl/firebaseAppIns';
import * as fs from 'firebase/firestore';
import MdlAuthUser from './mdl/MdlAuthUser';
import MdlBatsuGame from './mdl/MdlBatsuGame';
import MdlMatch from './mdl/MdlMatch';
import MdlPlayer from './mdl/MdlPlayer';
import MdlRound from './mdl/MdlRound';

/**
 * Firebaseとの接続を管理する。
 */
class FirebaseMngr {
  // メンバ変数の定義
  #db = null;
  #dbRefAuthUser = null;
  #dbRefPlayers = null;
  #dbRefTaisen = null;
  #dbRefChoice = null;
  #dbRefRounds = null;
  #dbRefBatsuGame = null;
  #dbRefRoundsOneRecord = null;
  #dbRefCreateId = null;

  // コンストラクタ
  constructor() {
    this.initialize();
  }

  // データベースリファレンス
  /**
   * データベース本体を取得
   */
  get db() { return this.#db; }
  /**
   * 認証ユーザー情報を保持
   */
  get dbRefAuthUser() { return this.#dbRefAuthUser; }
  /**
   * ユーザーデータ データベースリファレンスを取得
   */
  get dbRefPlayers() { return this.#dbRefPlayers; }
  /**
   * 対戦データ データベースリファレンスを取得
   */
  get dbRefTaisen() { return this.#dbRefTaisen; }
  /**
   * 選択手データ データベースリファレンスを取得
   */
  get dbRefChoice() { return this.#dbRefChoice; }
  /**
   * 状況データ データベースリファレンスを取得
   */
  get dbRefRounds() { return this.#dbRefRounds; }
  /**
   * 罰ゲームデータ データベースリファレンスを取得
   */
  get dbRefBatsuGame() { return this.#dbRefBatsuGame; }

  /**
   * データの初期化を行う
   */
  async initialize() {
    // データベース 関連 オブジェクト
    this.#db = fs.getFirestore(app);
    this.#dbRefAuthUser = fs.collection(this.db, "auth_users");
    this.#dbRefPlayers = fs.collection(this.db, "players");
    this.#dbRefTaisen = fs.collection(this.db, "taisens");
    this.#dbRefChoice = fs.collection(this.db, "choices");
    // onSnapshotで単一レコードのrefの場合、change.typeが取得できなかった(未精査)ので、
    // とりあえずcollectionの参照としている。
    this.#dbRefRounds = fs.collection(this.db, "rounds");
    this.#dbRefRoundsOneRecord = fs.doc(this.db, "rounds", "0");
    this.#dbRefBatsuGame = fs.collection(this.db, "batsu_game");
    this.#dbRefCreateId = fs.collection(this.db, "create_id");
  }

  /**
   * データを再帰的に削除する
   * RealtimeDatabaseのremoveはなくなった。
   * 入れ子のcollectionは親を削除しても消えないので、末端から全て削除する必要がある。
   * ただし、サブコレクションの配列を取得することができなかったため、
   * 直下のドキュメントだけすべて削除することにする。
   * @param {DBRef} dbRef 
   */
  async deleteDocs(dbRef) {
    const promises = [];

    const snapshot = await fs.getDocs(dbRef);
    snapshot.forEach((d) => {
      // ここでawaitをかけても処理を止められなかった。
      // そのため、promiseの配列を返却し、呼び出し元でawaitをかける。
      // 動作仕様は理解できていない。
      promises.push(fs.deleteDoc(d.ref));
    });

    return promises;
  };

  /**
   * データを全て削除する。
   */
  async removeAll() {
    Promise.all([
      MdlAuthUser.deleteAll(),
      this.deleteDocs(this.dbRefChoice),
      MdlRound.deleteAll(),
      MdlMatch.deleteAll(),
      MdlPlayer.deleteAll(),
      MdlBatsuGame.deleteAll()
    ]);
  }

  /**
   * 追加か更新を行う。
   * @param {fs.CollectionReference} colRef 
   * @param {string} id
   * @param {object} data
   * @returns {Promise}
   */
  async addOrReplace(colRef, id, data) {
    const docRef = fs.doc(colRef, id);
    const doc = await fs.getDoc(docRef);
    if (doc.exists) {
      return fs.updateDoc(doc, data);
    } else {
      return fs.addDoc(doc, data);
    }
  }

  /**
   * 指定idのドキュメントが存在するかを返却する。
   * @param {*} colRef 
   * @param {*} id 
   * @returns 
   */
  async exists(colRef, id) {
    const doc = await fs.getDoc(colRef, id);
    return doc.exists;
  }

  /**
   * 認証ユーザーの登録か更新を行う。
   * @param {string} uid 
   * @param {object} data 
   * @returns {Promise} 
   */
  async addOrReplaceAuthUser(uid, data) {
    return this.addOrReplace(this.dbRefAuthUser, uid, data);
  }

  /**
   * ラウンド格納テーブルを初期化する、設定ラウンドは0とする。
   */
  async initializeRound() {
    await fs.setDoc(this.#dbRefRoundsOneRecord, { round: 0 });
  }

  /**
   * ラウンドを更新する
   */
  async updateRound(round) {
    await fs.updateDoc(this.#dbRefRoundsOneRecord, { round: round });
  }

  /**
   * 罰ゲームを更新する。
   * updateイベントが拾いもれるケースがあったので、remove, setでaddで拾ってみる。
   * ラウンドのonChangeは取れているようなのでなんでだろう。
   * @param {string} batsuGame 罰ゲーム
   */
  async replaceBatsuGame(batsuGame) {
    await this.deleteDocs(this.dbRefBatsuGame);
    await fs.addDoc(this.dbRefBatsuGame, { batsuGame: batsuGame });
  }

  /**
   * 新しいユーザーを追加する。
   * @param {string} name 
   * @param {number} round 
   */
  async addPlayer(name, round, originalKeyPlayer, authUid) {


    const docRef = fs.doc(this.dbRefPlayers, authUid);

    const q = fs.query(this.dbRefPlayers, fs.where('authUid', '==', authUid), fs.where('round', '==', round));
    const querySnapshot = await fs.getDocs(q);
    if (querySnapshot.size !== 0) {
      return;
    }

    // オリジナルキーがない = 初回登録として、IDを発行して登録を行う。
    if (!originalKeyPlayer) {
      const refId = await fs.addDoc(this.#dbRefCreateId, { a: null });
      fs.setDoc(fs.doc(this.db, 'players', refId.id), {
        name: name,
        round: round,
        originalKeyPlayer: refId.id,
        authUid: authUid
      }
      );
      // オリジナルキーが存在する場合は、2回目以降としてデータの登録を行う。
    } else {
      fs.addDoc(this.dbRefPlayers, {
        name: name,
        round: round,
        originalKeyPlayer: originalKeyPlayer,
        authUid: authUid
      }
      );
    }
  }

  /**
   * ラウンド別の進出ユーザー情報を取得する。
   * Promiseオブジェクトを返却するため、呼び出し元ではawaitが必要。
   * @param {number} roundNo 
   * @returns [{key, val()}] ユーザー情報の配列。0件の場合も配列を返却
   */
  async getPlayers(roundNo) {
    const q = fs.query(this.dbRefPlayers, fs.where('round', "==", roundNo));
    const querySnapshot = await fs.getDocs(q);
    const ret = [];
    querySnapshot.forEach((s) => {
      // RealtimeDatabaseとの互換性の為、keyプロパティを生成しておく。
      s.key = s.id;
      s.val = s.data;
      ret.push(s);
    });

    return ret;
  }

  /**
   * 対戦を追加する。
   * @param {string} originalKeyPlayerA 1人目のプレイヤー
   * @param {string} namePlayerA 1人目のプレイヤーの名前
   * @param {string} originalKeyPlayerB 2人目のプレイヤー
   * @param {string} namePlayerB 2人目のプレイヤーの名前
   * @param {number} roundNo ラウンド数
   */
  async addTaisen(originalKeyPlayerA, namePlayerA, originalKeyPlayerB, namePlayerB, roundNo) {
    const newTaisen = {
      originalKeyPlayerA: originalKeyPlayerA,
      namePlayerA: namePlayerA,
      originalKeyPlayerB: originalKeyPlayerB,
      namePlayerB: namePlayerB,
      keyWinnerPlayer: null,
      unexecutedMatch: false,
      round: roundNo
    }
    await fs.addDoc(this.dbRefTaisen, newTaisen);
  }

  /**
   * 対戦データを更新する。
   * @param {string} keyTaisen 対戦データのキー
   * @param {object} toObj 更新内容
   */
  async updateTaisen(keyTaisen, toObj) {
    const update_item = fs.doc(this.db, "taisen", keyTaisen);
    await fs.updateDoc(update_item, toObj);
  }

  /**
   * 特定ラウンド内の未実行の対戦を実行済みとする。
   * @param {number} round 
   */
  async updateTaisenUnexecuted(round) {
    const q = fs.query(
      this.dbRefTaisen,
      fs.where('keyWinnerPlayer', "==", null),
      fs.where('round', '==', round)
    );
    const querySnapshot = await fs.getDocs(q);
    const taisens = [];
    querySnapshot.forEach((s) => {
      // RealtimeDatabaseとの互換性の為、keyプロパティを生成しておく。
      s.key = s.id;
      s.val = s.data;
      taisens.push(s);
    });

    taisens.forEach((taisen) => {
      this.updateTaisen(
        taisen.key,
        { unexecutedMatch: true }
      );
    });
  }

  /**
   * アタッチの共通処理。RealtimeDatabaseのon〜イベントを再現する。
   * @param {DBRef} ref データベースリファレンス
   * @param {function} callBack イベントハンドラ
   * @param {string} changeType 変更タイプ
   * @returns 
   */
  setOnSnapshot(ref, callBack, changeType) {
    if (!["added", "modified", "removed"].includes(changeType)) {
      throw new Error('不正な changeType です。');
    }

    const unsubscribe = fs.onSnapshot(ref, (snapshot) => {
      // console.log('hasPendingWrites: ' + snapshot.metadata.hasPendingWrites);

      if (typeof snapshot.docChanges != "function") {
        console.log('snapshot.docChanges is not a function');
      }

      snapshot.docChanges().forEach((change) => {
        let ret = change.doc;
        ret.key = change.doc.id;
        ret.val = change.doc.data;

        if (change.type === "added" && change.type === changeType) {
          callBack(ret);
        }
        if (change.type === "modified" && change.type === changeType) {
          callBack(ret);
        }
        if (change.type === "removed" && change.type === changeType) {
          callBack(ret);
        }
      });
    });

    // デタッチファンクションを返却する。
    return unsubscribe;
  }



  /**
   * データ追加時のイベントを設定する。
   * @param {DBRef} dbRef 監視対象のテーブル
   * @param {function} callBack イベントハンドラ
   * @returns {function} デタッチファンクション
   */
  setOnChildAdded(dbRef, callBack) {
    return this.setOnSnapshot(dbRef, callBack, 'added');
  }

  /**
   * データ変更時のイベントを設定する。
   * @param {DBRef} dbRef 監視対象のテーブル
   * @param {function} callBack イベントハンドラ
   * @returns {function} デタッチファンクション
   */
  setOnChildChanged(dbRef, callBack) {
    return this.setOnSnapshot(dbRef, callBack, 'modified');
  }

  /**
   * データ削除時のイベントを設定する。
   * @param {DBRef} dbRef 監視対象のテーブル
   * @param {function} callBack イベントハンドラ
   * @returns {function} デタッチファンクション
   */
  setOnChildRemoved(dbRef, callBack) {
    return this.setOnSnapshot(dbRef, callBack, 'removed');
  }

  /**
   * じゃんけんの手の追加を行う
   * @param {string} keyTaisen 
   * @param {number} turn 
   * @param {string} keyPlayer 
   * @param {string} name 
   * @param {string} choice 
   * @param {string} choiceVal 
   * @param {string} winVS 
   */
  addChoice(keyTaisen, turn, keyPlayer, name, choice, choiceVal, winVS) {
    const choiceObj = {
      keyTaisen: keyTaisen,
      turn: turn,
      keyPlayer: keyPlayer,
      name: name,
      choice: choice,
      choiceVal: choiceVal,
      winVS: winVS,
      result: null
    };
    fs.addDoc(this.dbRefChoice, choiceObj);
  }
}

// インポート先では単一のインスタンスが参照される。
// このことにより、シングルトンを実現する
// const _instance = new FirebaseMngr();
// export default _instance;
const _instance = new FirebaseMngr();
export default _instance;
// export default FirebaseMngr;