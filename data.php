<?php

$data = json_decode(file_get_contents('science_keyword.json'));
if(!empty($_GET['q'])){
	$q = strtolower($_GET['q']);
	foreach($data as $i=>$term){
		if(strpos(strtolower($term[1]), $q)===false){
			unset($data[$i]);
		}
	}
}
header('Content-type:application/json;charset=utf-8');
echo json_encode(array_values($data));