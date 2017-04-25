
var g_pos = -1;
var g_path = "/";
var g_file_list = [];

function dirname(path){
	var a = path.split("/");
	if(a.length == 1){
		return a[0];
	}
	a.pop();
	return a.join("/");
	
}
function basename(path){
	var a = path.split("/");
	if(a.length == 1){
		return a[0];
	}
	return a.pop();
}
function is_dir(path){
	return basename(path).indexOf(".") == -1;
}
function up(){
	show_path(dirname(g_path));
}
function reload(){
	show_path(g_path);
}
function show_file_list(json){
	var files = JSON.parse(json);
	var file_list = files.file_list;
	g_file_list = file_list;
	var ax = "";
	ax += "<div><h2>"+g_path+"</h2></div>";
	ax += "<div ondblclick='up()' ><a onclick='reload()' >&#10226;</a> <a id='link_parent'  > Up one Directory (..) </a></div>";
	for(var i =0;i<file_list.length;i++){
		var dir = is_dir(file_list[i]);
		var icon = "&#128221;"; // FILE
		if(dir){
			icon = "&#128194"; // FOLDER
		}
		ax += "<div class=ff onclick='select_file("+i+")' ondblclick='show_path(\""+file_list[i]+"\")' >";
		ax += "<a class=file id=link_"+i+">" + icon + " "+ basename(file_list[i]) + "</a>";
		ax += "</div>";
	}
	console.log(file_list);
	put("file_list",ax);

	select_file(g_pos);
	show_mappings();
	
}
function is_image(path){
	var b = basename(path);
	var ext = (b.split(".").pop()).toUpperCase();
	if(ext == "JPG" || ext == "PNG" || ext == "GIF" || ext == "JPEG" || ext == "BMP" ){
		return true;
	}
	return false;
}
function is_document(path){
	var b = basename(path);
	var ext = (b.split(".").pop()).toUpperCase();
	if(ext == "PDF" || ext == "HTML" || ext == "TXT" ){
		return true;
	}
	return false;
}
function file_at(pos){
	return g_file_list[pos];
}
function select_file(x){
	g_pos = x;
	if(is_image(file_at(g_pos))){
		put("file_preview", "<img style='width:100%' class=file_preview src='"+file_at(g_pos)+"' alt='"+file_at(g_pos)+"' />");
	}else if(is_document(file_at(g_pos))){
		put("file_preview", "<iframe style='height:100%;width:100%' class=file_preview src='"+file_at(g_pos)+"' alt='"+file_at(g_pos)+"' border=0></iframe>");
	}else{
		put("file_preview", "");
	}
	highlight_position();
}
function put(x,y){
	document.getElementById(x).innerHTML = y;
}
function add_mapping(){
	var x = prompt("Enter Letter:","X");
	if(x !== null){
		if(x.length != 1){
			alert("Mappings can only be a single character.");
			return;
		}
		if(x == "r" ||x == "R" ){
			alert("Taken");
			return;
		}
		var y = prompt("Enter Folder:","./dst/");
		g_map[x.charCodeAt(0)] = y;
		show_mappings();
	}
}
function show_mappings(){
	var ax = "";
	var map = get_map();
	map["R".charCodeAt(0)] = "Reload Directory";

	for(var i in map){
		ax += String.fromCharCode(i) + " : " + map[i] + "<br/>";
	}
	ax += "<br/><a onclick='add_mapping()' href='#' >Create Keyboard Mapping</a>";
	put("mappings", ax);
}
function get_map(){
	return g_map;
}
function highlight_position(){
	var a = document.querySelectorAll("a.file");
	for(var i=0;i<a.length;i++){
		a[i].style.backgroundColor = "white";
		a[i].style.color = "black";
	}
	if(g_pos >= 0 && g_pos < a.length){
		a[g_pos].style.backgroundColor = "rgb(20,20,255)";
		a[g_pos].style.color = "white";
	}

}
function next_file(){
	g_pos++;
	if(g_pos >= g_file_list.length){
		g_pos = g_file_list.length-1;
	}
	select_file(g_pos);

}
function key_pressed(event){
	var map = get_map();
	var kc = event.keyCode;
	if(kc == 40){ //DOWN
		next_file();
		return;
	}
	if(kc == 38){ //DOWN
		g_pos--;
		if(g_pos < 0){
			g_pos = 0;
		}
		select_file(g_pos);
		return;
	}
	if(kc == 13){ //ENTER
		if(is_dir(file_at(g_pos))){
			show_path(file_at(g_pos));
		}
		return;
	}
	if(kc == 82){ //R
		reload();
		return;
	}
	if(kc == 8){ //backspace
		up();
		return;
	}
	if(kc in map){
		ajax("GET","http://localhost:3000/move_file/?path="+encodeURIComponent(file_at(g_pos))+"&destination="+encodeURIComponent(map[kc]+"/" + basename(file_at(g_pos))),function(res){
			if(res == "OK"){
				document.getElementById("link_" + g_pos).style.textDecoration = "line-through";
				next_file();
			}else{
				document.title = res;
			}
		});
	}else{
		if(kc >= 65 && kc <= 90){
			alert(String.fromCharCode(kc) + " is not mapped.");
		}
	}
}
function show_path(path){
	g_path = path;
	g_pos = 0;
	ajax("GET","http://localhost:3000/file_list/?path="+encodeURIComponent(g_path),show_file_list);
}
function init(){
	show_path(g_config_start);
	put("file_preview","");
}
