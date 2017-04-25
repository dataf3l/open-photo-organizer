//ajax 
function ajax(method, url,callback){
	var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("MSXML2.XMLHTTP.3.0");

	xhr.open(method,url,true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4 && xhr.status == 200){
			callback(xhr.responseText);
		}
	}  
	xhr.send();
}
