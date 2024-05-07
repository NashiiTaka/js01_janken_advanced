import * as fb from 'firebase/app';
import * as fs from 'firebase/firestore';
// lewin550
const firebaseConfig = {
    apiKey: "AIzaSyBYHC7mgehcnO58aE8PQYJqyxUSToZGioo",
    authDomain: "sample-bdcb1.firebaseapp.com",
    databaseURL: "https://sample-bdcb1-default-rtdb.firebaseio.com",
    projectId: "sample-bdcb1",
    storageBucket: "sample-bdcb1.appspot.com",
    messagingSenderId: "525120777563",
    appId: "1:525120777563:web:6be05da75085ec7aa37e7e"
};

// hasukolewin
// const firebaseConfig = {
//     apiKey: "AIzaSyAMpISjQvK3j8l4fuAMrbn3dhHgt4Ou1PU",
//     authDomain: "test-52d4b.firebaseapp.com",
//     projectId: "test-52d4b",
//     storageBucket: "test-52d4b.appspot.com",
//     messagingSenderId: "1026117556559",
//     appId: "1:1026117556559:web:530f69015903f606584d3a"
// };

const app = fb.initializeApp(firebaseConfig);

/**
 * Firebaseとの接続を管理する。
 */
class FirebaseMngr {
    // メンバ変数の定義
    #db = null;
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
        this.#dbRefPlayers = fs.collection(this.db, "janken_players");
        this.#dbRefTaisen = fs.collection(this.db, "janken_taisen");
        this.#dbRefChoice = fs.collection(this.db, "janken_choice");
        // onSnapshotで単一レコードのrefの場合、change.typeが取得できなかった(未精査)ので、
        // とりあえずcollectionの参照としている。
        this.#dbRefRounds = fs.collection(this.db, "janken_rounds");
        this.#dbRefRoundsOneRecord = fs.doc(this.db, "janken_rounds", "0");
        this.#dbRefBatsuGame = fs.collection(this.db, "janken_batsu_game");
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
        fs.getDocs(dbRef).then((ss) => {
            ss.forEach(async (d) => {
                await fs.deleteDoc(d.ref);
            });
        });
    };

    /**
     * データを全て削除する。
     */
    async removeAll() {
        await this.deleteDocs(this.dbRefChoice);
        await this.deleteDocs(this.dbRefRounds);
        await this.deleteDocs(this.dbRefTaisen);
        await this.deleteDocs(this.dbRefPlayers);
        await this.deleteDocs(this.dbRefBatsuGame);
        await this.deleteDocs(this.#dbRefCreateId);
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
        await this.deleteDocs(this.#dbRefBatsuGame);
        await fs.addDoc(this.#dbRefBatsuGame, { batsuGame: batsuGame });
    }

    /**
     * 新しいユーザーを追加する。
     * @param {string} name 
     * @param {number} round 
     */
    async addPlayer(name, round, originalKeyPlayer) {
        // オリジナルキーがない = 初回登録として、IDを発行して登録を行う。
        if (!originalKeyPlayer) {
            const refId = await fs.addDoc(this.#dbRefCreateId, { a: null });
            fs.setDoc(fs.doc(this.db, 'janken_players', refId.id), {
                name: name,
                round: round,
                originalKeyPlayer: refId.id
            }
            );
            // オリジナルキーが存在する場合は、2回目以降としてデータの登録を行う。
        } else {
            fs.addDoc(this.dbRefPlayers, {
                name: name,
                round: round,
                originalKeyPlayer: originalKeyPlayer
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
            unexecutedTaisen: false,
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
        const update_item = fs.doc(this.db, "janken_taisen", keyTaisen);
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
                { unexecutedTaisen: true }
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
// const _instance = new FirebaseMngr();
// export default _instance;
export default FirebaseMngr;