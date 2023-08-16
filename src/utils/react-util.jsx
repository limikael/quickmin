import {useEffect, useState, useMemo, useRef} from "preact/compat";
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
