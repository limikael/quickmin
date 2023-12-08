export const loaderTemplate=`<!DOCTYPE html>
<html>
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
		<meta charset="utf-8"/>
		<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
		<link href="https://unpkg.com/jsoneditor@9.10.4/dist/jsoneditor.min.css" rel="stylesheet" type="text/css">
   		<style>
			#loader-outer {
				width: 100vw;
				height: 100vh;
				position: fixed;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			#loader-inner {
				width: 200px;
				height: 200px;
				font-size: 100px;
				text-align: center;
				font-family: monospace;
				color: #2196F3;
				cursor: default;
				font-weight: bold;
			}
		</style>
	</head>
	<body style="margin: 0">
		<div id="app"></div>
		<div id="loader-outer">
			<div id="loader-inner"></div>
		</div>
		<script>
			(async()=>{
				let loaderProps=$$LOADER_PROPS$$;

				let animateCounter=0;
				function animateLoader() {
					animateCounter++;
					let m=animateCounter%6;
					let s=
						((m>=0 && m<=2)?".":"\u00a0")+
						((m>=1 && m<=3)?".":"\u00a0")+
						((m>=2 && m<=4)?".":"\u00a0");

					let el=document.getElementById("loader-inner");
					el.innerText=s;
				}

				let intervalId=setInterval(animateLoader,200);
				let adminModule=await import(loaderProps.bundleUrl);

				loaderProps.onload=()=>{
					clearInterval(intervalId);
					document.getElementById("loader-outer").remove();
				};

				let el=document.getElementById("app");
				adminModule.renderQuickminAdmin(loaderProps,el);
			})();
		</script>
	</body>
</html>
`;