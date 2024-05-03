// Firebaseの初期化
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
import { getDatabase, ref, push, set, onChildAdded, remove, onChildRemoved, update, onChildChanged, onValue, orderByChild, query, equalTo }
    from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBYHC7mgehcnO58aE8PQYJqyxUSToZGioo",
    authDomain: "sample-bdcb1.firebaseapp.com",
    projectId: "sample-bdcb1",
    storageBucket: "sample-bdcb1.appspot.com",
    messagingSenderId: "525120777563",
    appId: "1:525120777563:web:e3d17ab3e2f3ab32a37e7e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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
    initialize() {
        // データベース 関連 オブジェクト
        this.#db = getDatabase(app);
        this.#dbRefPlayers = ref(this.db, "janken_players");
        this.#dbRefTaisen = ref(this.#db, "janken_taisen");
        this.#dbRefChoice = ref(this.#db, "janken_choice");
        this.#dbRefRounds = ref(this.#db, "janken_rounds/0");
        const newRound = {
            round: 0
        }
        set(this.#dbRefRounds, newRound);

        this.#dbRefBatsuGame = ref(this.#db, "janken_batsu_game");
    }

    /**
     * データを全て削除する。
     */
    removeAll() {
        remove(this.#dbRefChoice);
        remove(this.#dbRefRounds);
        remove(this.#dbRefTaisen);
        remove(this.#dbRefPlayers);
        remove(this.#dbRefBatsuGame);
    }

    /**
     * ラウンドを更新する
     */
    updateRound(round) {
        update(this.dbRefRounds, { round: round });
    }

    /**
     * 罰ゲームを更新する。
     * updateイベントが拾いもれるケースがあったので、remove, setでaddで拾ってみる。
     * ラウンドのonChangeは取れているようなのでなんでだろう。
     * @param {string} batsuGame 罰ゲーム
     */
    replaceBatsuGame(batsuGame) {
        remove(this.#dbRefBatsuGame);
        set(this.#dbRefBatsuGame, { batsuGame: batsuGame });
    }

    /**
     * 新しいユーザーを追加する。
     * @param {string} name 
     * @param {number} round 
     */
    addPlayer(name, round, originalKeyPlayer) {
        const newPostRef = push(this.dbRefPlayers);
        set(newPostRef, {
            name: name,
            round: round,
            originalKeyPlayer: originalKeyPlayer || newPostRef.key
        });
    }

    /**
     * ラウンド別の進出ユーザー情報を取得する。
     * Promiseオブジェクトを返却するため、呼び出し元ではawaitが必要。
     * @param {number} roundNo 
     * @returns [{key, val()}] ユーザー情報の配列。0件の場合も配列を返却
     */
    getPlayers(roundNo) {
        return new Promise((resolve) => {
            onValue(this.dbRefPlayers, (snapshot) => {
                const ret = [];
                snapshot.forEach((childSnapshot) => {
                    if (childSnapshot.val().round == roundNo) {
                        ret.push(childSnapshot);
                    }
                });
                // 作成したユーザ配列で非同期処理を完了させる。
                resolve(ret);
            }, {
                onlyOnce: true
            });
        });
    }

    /**
     * 対戦を追加する。
     * @param {string} originalKeyPlayerA 1人目のプレイヤー
     * @param {string} namePlayerA 1人目のプレイヤーの名前
     * @param {string} originalKeyPlayerB 2人目のプレイヤー
     * @param {string} namePlayerB 2人目のプレイヤーの名前
     * @param {number} roundNo ラウンド数
     */
    addTaisen(originalKeyPlayerA, namePlayerA, originalKeyPlayerB, namePlayerB, roundNo) {
        const newTaisenId = push(this.dbRefTaisen);
        const newTaisen = {
            originalKeyPlayerA: originalKeyPlayerA,
            namePlayerA: namePlayerA,
            originalKeyPlayerB: originalKeyPlayerB,
            namePlayerB: namePlayerB,
            keyWinnerPlayer: null,
            unexecutedTaisen: false,
            round: roundNo
        }
        set(newTaisenId, newTaisen);
    }

    /**
     * 対戦データを更新する。
     * @param {*} keyTaisen 対戦データのキー
     * @param {*} toObj 更新内容
     */
    updateTaisen(keyTaisen, toObj) {
        const update_item = ref(this.db, "janken_taisen/" + keyTaisen);
        update(update_item, toObj)
    }

    async updateTaisenUnexecuted(round) {
        const taisens = await new Promise((resolve) => {
            // keyWinnerPlayerがnullのデータだけを抽出する
            // 特定の項目をwhereの条件にする場合は、orderByChildでその項目を指定する必要があるらしい。
            // 複数項目の条件設定はできなそう。複雑なクエリは難しい。ここでもラウンドと未決着の両方が必要だったがクエリで一気には指定できない。
            // @see https://firebase.google.com/docs/database/web/lists-of-data?hl=ja&_gl=1*ak087r*_up*MQ..*_ga*MjA4NTY4NTc1OC4xNzE0NTE5Njg2*_ga_CW55HF8NVT*MTcxNDUxOTY4NS4xLjAuMTcxNDUxOTY4NS4wLjAuMA..
            // GPT生成 エラー → const query = ref(this.db, "janken_taisen").orderByChild("keyWinnerPlayer").equalTo(null);
            const q = query(this.dbRefTaisen, orderByChild("keyWinnerPlayer"), equalTo(null));
            const ret = [];
            onValue(q, (snapshot) => {
                snapshot.forEach((childSnapshot) => {
                    if(childSnapshot.val().round == round){
                        ret.push(childSnapshot);
                    }
                });
            });
            // 作成したユーザ配列で非同期処理を完了させる。
            resolve(ret);
        }, {
            // イマイチ意味がわかっていない。
            onlyOnce: true
        });

        taisens.forEach((taisen) => {
            this.updateTaisen(
                taisen.key, 
                { unexecutedTaisen: true }
            );
        });
    };

    /**
     * データ追加時のイベントを設定する。
     * @param {*} dbRef 監視対象のテーブル
     * @param {function} callBack イベントハンドラ
     */
    setOnChildAdded(dbRef, callBack) {
        onChildAdded(dbRef, callBack);
    }

    /**
     * データ変更時のイベントを設定する。
     * @param {*} dfRef 監視対象のテーブル
     * @param {function} callBack イベントハンドラ
     */
    setOnChildChanged(dfRef, callBack) {
        onChildChanged(dfRef, callBack);
    }

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
        const newChoiceRef = push(this.dbRefChoice);
        set(newChoiceRef, choiceObj);
    }
}

// インポート先では単一のインスタンスが参照される。
// このことにより、シングルトンを実現する
export default new FirebaseMngr();