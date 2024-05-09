import './css/Header.css'

import authMngr from '../js/AuthMngr';
import { useState, useEffect, useRef } from 'react';

export default function GameSettings(props) {
    const user = authMngr.user;
    const [displayName, setDisplayName] = useState(user.displayName);
    const refCalled = useRef(false);

    useEffect(() => {
        // 2重実行されるケースが多発するため、フラグ管理して1回だけの実行に限定する。
        if (refCalled.current) { return; }
        refCalled.current = true;

        props.fb.addPlayer(user.displayName, props.jdm.round === 0 ? 1 : props.jdm.round, null, user.uid);
    });

    const hideInputClassName = props.jdm.isPlayerAdmin ? '' : 'hide';

    return (
        <div>
            <div>
                {/* 名前を入力してください。 */}
                You are
                <input
                    type="text"
                    id="txtName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={true}
                />
                <input type="hidden" id="hiddenUid" value={authMngr.user.uid} />
                {/* <input
                    id="btnRegisterName"
                    type="submit"
                    value="表示名を変更する"
                    onClick={ (e) => onBtnRegisterName(e) }
                /> */}
                <input id="btnCloseRound" type="submit" value="エントリー締切" className={hideInputClassName} />
                <input id="btnReset" type="submit" value="データリセット" className={hideInputClassName} onClick={ () => { props.fb.removeAll() } } />
            </div>
            <div className="batsu-wrapper">
                バツゲーム<input type="text" id="batsu-game" disabled={!props.jdm.isPlayerAdmin} />
                <input id="btnGenBatsu" type="submit" value="自動生成" className={hideInputClassName} />
                <input id="btnBatsuKakutei" type="submit" value="確定" className={hideInputClassName} />
            </div>
        </div>
    )
}