// import './css/RegistAuthUser.css'

import React, { useState, useEffect, useRef } from 'react';

import at from '../js/AuthMngr';
import MdlAuthUser from '../js/mdl/MdlAuthUser';

export default function RegistAuthUser(props) {
  const [nickName, setNickName] = useState(at.user.displayName);
  const [checking, setChecking] = useState(false);
  const [registDisabled, setRegistDisabled] = useState(false);
  const refCalled = useRef(false);

  useEffect(() => {
    // 2重実行されるケースが多発するため、フラグ管理して1回だけの実行に限定する。
    if(refCalled.current){ return; }
    refCalled.current = true;
  });

  function  registNickName(){
    const trimedName = nickName.trim();
    if(!trimedName){
      alert('ニックネームを登録してください。');
    }else{
      setRegistDisabled(true);
      setChecking(true);
      MdlAuthUser.exists('nickName', '==', trimedName).then(async (exists) => {
        if(exists){
          alert('このニックネームはすでに使用されています。変更してください。');
          setRegistDisabled(false);
        }else{
          const mdlUser = new MdlAuthUser(at.user.uid, true);
          mdlUser._nickName = trimedName;
          // 保存が完了したら、処理完了のcallbackを実行する。
          mdlUser.onAdded(props.onAuthUserRegisted);
          mdlUser.save();
        }

        setChecking(false);
      });
    }
  }

  return (
    <div>
      Enter Your NickName
      <input
        type='text'
        value={nickName}
        disabled={registDisabled}
        onChange={ e => setNickName(e.target.value) }
      />
      <button
        disabled={registDisabled}
        onClick={registNickName}
      >
        登録
      </button>
    </div>
  );

}