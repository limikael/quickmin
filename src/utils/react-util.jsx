import {useEffect, useState, useMemo, useRef, useCallback, useLayoutEffect} from "preact/compat";
import {isPromise} from "./js-util.js";

export function useEventListener(o, ev, fn) {
	useLayoutEffect(()=>{
		o.addEventListener(ev,fn);
		return ()=>{
			o.removeEventListener(ev,fn);
		}
	},[o,ev,fn]);
}

export function useEventUpdate(o, ev) {
	let [_,setDummyState]=useState();
	let forceUpdate=useCallback(()=>setDummyState({}));
	useEventListener(o,ev,forceUpdate);
}

export function useForceUpdate() {
    const [, setValue]=useState({});
    return useCallback(()=>{
        setValue({});
    },[]);
}

export function useIsChanged(val) {
	let ref=useRef();
	if (val===ref.current)
		return false;

	ref.current=val;
	return true;
}

export function useIsFirstRun() {
	let ref=useRef();

	if (ref.current)
		return false;

	ref.current=true;
	return true;
}

export function useIsStale(val) {
	let changed=useIsChanged(val);
	let firstRun=useIsFirstRun();

	return (changed || firstRun);
}

export function useAsyncMemo(fn, deps) {
	let ref=useRef({});
	let stale=useIsStale(JSON.stringify(deps));
	let forceUpdate=useForceUpdate();

	function checkError(valueOrError) {
		if (valueOrError instanceof Error)
			throw valueOrError;

		return valueOrError;
	}

	//console.log("stale: "+stale);

	if (!stale && !ref.current.again) {
		return checkError(ref.current.value);
	}

	if (ref.current.running) {
		ref.current.again=true;
		return checkError(ref.current.value);
	}

	ref.current.value=undefined;
	ref.current.again=false;
	ref.current.running=true;
	let fnRet=fn();

	if (isPromise(fnRet)) {
		fnRet.then(res=>{
			ref.current.running=false;
			if (!ref.current.again)
				ref.current.value=res;

			forceUpdate();
		})
		.catch(e=>{
			ref.current.running=false;

			if (!(e instanceof Error))
				e=new Error(e);

			if (!ref.current.again)
				ref.current.value=e;

			forceUpdate();
		});
	}

	else {
		ref.current.value=fnRet;
		ref.current.running=false;
	}

	return checkError(ref.current.value);
}

/*export function useIsValueChanged(val) {
	let ref=useRef();
	if (val==ref.current)
		return false;

	ref.current=val;
	return true;
}*/