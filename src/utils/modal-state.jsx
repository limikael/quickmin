import {useRef, createContext, useContext, useEffect} from "react";
import {useConstructor, useEventUpdate} from "./react-util.jsx";
import {ResolvablePromise} from "./js-util.js";

let ModalContext=createContext();

class ModalState extends EventTarget {
	constructor() {
		super();
		this.modals=[];
	}

	addInstance(modal) {
		this.modals.push(modal);
		this.dispatchEvent(new Event("change"));
	}

	removeInstance(modal) {
		let idx=this.modals.indexOf(modal);
		if (idx>=0)
			this.modals.splice(idx,1);

		this.dispatchEvent(new Event("change"));
	}
}

export function ModalProvider({children}) {
	let modalState=useConstructor(()=>new ModalState());
	useEventUpdate(modalState,"change");

	return (
		<ModalContext.Provider value={modalState}>
			<div style="display: contents">
				{children}
			</div>
			<div style="display: contents">
				{modalState.modals.map(m=>m.content)}
			</div>
		</ModalContext.Provider>
	);
}

class ModalInstance {
	constructor(modalState) {
		this.modalState=modalState;
	}

	show=(content)=>{
		if (this.promise)
			this.promise.resolve();

		this.content=content;
		this.promise=new ResolvablePromise();
		this.modalState.dispatchEvent(new Event("change"));

		return this.promise;
	}

	dismiss=(value)=>{
		this.content=undefined;
		this.promise.resolve(value);
		this.modalState.dispatchEvent(new Event("change"));
	}

	dismissModal=async (value)=>{
		return await this.dismiss(value);
	}

	showModal=async (content)=>{
		return await this.show(content);
	}
}

export function useModal() {
	let modalState=useContext(ModalContext);
	let modalInstance=useConstructor(()=>new ModalInstance(modalState));
	useEffect(()=>{
		modalState.addInstance(modalInstance);
		return ()=>{
			modalState.removeInstance(modalInstance);
		}
	},[]);

	return modalInstance;
}
