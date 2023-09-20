import {useState, useEffect, useRef} from "react";
import {useIsoContext} from "isoq";

function Spinner() {
	let [t,setT]=useState(0);
	let tRef=useRef(0);

	useEffect(()=>{
		let id=setInterval(()=>{
			tRef.current+=1;
			setT(tRef.current);
		},200);

		return ()=>{
			clearInterval(id);
		}
	},[]);

	let m=t%6;
	let s=
		((m>=0 && m<=2)?".":"\u00a0")+
		((m>=1 && m<=3)?".":"\u00a0")+
		((m>=2 && m<=4)?".":"\u00a0");

	return (<>
		<div>
			<div style={{
					width: "100vw",
					height: "100vh",
					position: "fixed",
					display: "flex",
					alignItems: "center",
					justifyContent: "center"
				}}>
				<div style={{
						width: "200px",
						height: "200px",
						fontSize: "100px",
						textAlign: "center",
						fontFamily: "monospace",
						color: "#2196F3",
						cursor: "default"
					}}>
					<b>{s}</b>
				</div>
			</div>
		</div>
	</>)
}

export default function QuickminLoader(props) {
	let [adminLoaded,setAdminLoaded]=useState();
	let iso=useIsoContext();
	let ref=useRef();
	useEffect(()=>{
		if (iso.isSsr())
			return;

		(async()=>{
			let adminModule=await import(props.quickminBundleUrl);

			props={...props,onload: ()=>setAdminLoaded(true)};
			adminModule.renderQuickminAdmin(props,ref.current);
		})();
	},[]);

	return (<>
		<div ref={ref} />
		{!adminLoaded && <Spinner/>}
	</>);
}