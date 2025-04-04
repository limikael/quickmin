import {useEffect, useState, useMemo, useRef, useCallback, useLayoutEffect} from "preact/compat";
import {fetchEx} from "./js-util.js";

export function useAsyncMemo(fn, deps) {
	let [val,setVal]=useState();
	let queueRef=useRef();
	let runningRef=useRef(false);

	useEffect(()=>{
		(async ()=>{
			if (runningRef.current) {
				queueRef.current=fn;
				return;
			}

			queueRef.current=fn;
			while (queueRef.current) {
				let f=queueRef.current;
				queueRef.current=null;
				runningRef.current=true;
				try {
					setVal(undefined);
					let res=await f();
					if (!queueRef.current)
						setVal(res);
				}

				catch (e) {
					console.error(e);
					if (!queueRef.current)
						setVal(e);
				}

				runningRef.current=false;
			}
		})();
	},deps);

	return val;
}

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

export function useIsValueChanged(val) {
	let ref=useRef();
	if (val==ref.current)
		return false;

	ref.current=val;
	return true;
}

export function useIsValueChangedJson(val) {
	return useIsValueChanged(JSON.stringify(val));
}